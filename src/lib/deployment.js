import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import AdmZip from 'adm-zip';
import crypto from 'crypto';

const execAsync = promisify(exec);

// --- Persistence Logic ---

const DB_PATH = path.join(process.cwd(), 'data', 'store.json');

// In-memory store (populated from file)
let deployments = new Map();
let clones = new Map();
let isLoaded = false;

// Ensure data directory exists
async function ensureDb() {
    const dir = path.dirname(DB_PATH);
    try { await fs.mkdir(dir, { recursive: true }); } catch (e) { }
}

async function loadData() {
    if (isLoaded) return;
    await ensureDb();
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        const json = JSON.parse(data);

        // Restore Maps
        if (json.deployments) {
            deployments = new Map(json.deployments);
        }
        if (json.clones) {
            clones = new Map(json.clones);
        }
    } catch (e) {
        // If file doesn't exist or corrupt, start empty
        if (e.code !== 'ENOENT') console.error('Error loading DB:', e);
    }
    isLoaded = true;
}

async function saveData() {
    await ensureDb();
    const data = {
        deployments: Array.from(deployments.entries()),
        clones: Array.from(clones.entries())
    };
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving DB:', e);
    }
}


export const DeploymentStatus = {
    IDLE: 'idle',
    CLONING: 'cloning',
    BUILDING: 'building',
    DEPLOYING: 'deploying',
    SUCCESS: 'success',
    FAILURE: 'failure',
};

// --- Exported Functions (Async for DB access) ---

export async function createDeployment(repoUrl, platform, authToken, repoId) {
    await loadData();
    const id = Math.random().toString(36).substring(7);
    const deployment = {
        id,
        repoUrl,
        repoId,
        platform,
        authToken,
        status: DeploymentStatus.CLONING,
        logs: [],
        timestamp: new Date().toISOString(),
        url: null
    };
    deployments.set(id, deployment);
    await saveData();

    // Start background process
    if (platform === 'Vercel') {
        processVercelDeployment(id);
    } else if (platform === 'Netlify') {
        processNetlifyDeployment(id);
    } else {
        simulateGenericDeployment(id);
    }

    return id;
}

export async function getDeployment(id) {
    await loadData();
    return deployments.get(id);
}

export async function getAllDeployments() {
    await loadData();
    return Array.from(deployments.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function deleteDeployment(id) {
    await loadData();
    const result = deployments.delete(id);
    if (result) await saveData();
    return result;
}

export async function getAllClones() {
    await loadData();
    return Array.from(clones.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function deleteClone(id) {
    await loadData();
    const clone = clones.get(id);
    if (!clone) return false;

    // Delete from File System
    try {
        await fs.rm(clone.path, { recursive: true, force: true });
    } catch (e) {
        console.error(`Failed to delete clone folder ${id}:`, e);
        // We continue to remove from DB even if file delete fails (maybe already gone)
    }

    // Delete from DB
    clones.delete(id);
    await saveData();
    return true;
}

// --- Helper Functions ---

function computeSHA(data) {
    return crypto.createHash('sha1').update(data).digest('hex');
}

async function cloneRepository(repoUrl, id, addLog) {
    const tempRoot = path.join(process.cwd(), 'temp_deployments');
    try { await fs.mkdir(tempRoot, { recursive: true }); } catch (e) { }

    const clonePath = path.join(tempRoot, `deploy-${id}`);

    // Clean up if exists
    try { await fs.rm(clonePath, { recursive: true, force: true }); } catch (e) { }

    addLog(`Cloning ${repoUrl} to: ${clonePath}`);
    try {
        await execAsync(`git clone ${repoUrl} ${clonePath}`);
        addLog('Repository cloned successfully.');

        // Track clone (and persist)
        clones.set(id, {
            id,
            repoUrl,
            path: clonePath,
            timestamp: new Date().toISOString()
        });
        saveData(); // Save clone info to DB

        return clonePath;
    } catch (error) {
        throw new Error(`Git clone failed: ${error.message}`);
    }
}

async function getFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '.git') continue;
            const subFiles = await getFiles(fullPath);
            files.push(...subFiles);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Vercel Logic ---

async function processVercelDeployment(id) {
    // Helper to update state and save to DB
    // We debounce the save to avoid hammering disk on every log
    const update = async (fn) => {
        await loadData();
        const d = deployments.get(id);
        if (d) {
            fn(d);
            deployments.set(id, d);
            // In real app, debounce this. For now, we save on critical updates.
        }
    };

    // For logs, we might just keep in memory until end or periodic?
    // Let's simple-save for now.
    const addLog = (msg) => {
        const d = deployments.get(id);
        if (d) {
            d.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
            // We don't await save here to stay fast, but maybe occasional save
        }
    };

    const setStatus = (s) => {
        const d = deployments.get(id);
        if (d) {
            d.status = s;
            saveData(); // Critical state change, save immediately
        }
    };

    let clonePath = null;

    try {
        const d = deployments.get(id);
        setStatus(DeploymentStatus.CLONING);

        const clonePath = await cloneRepository(d.repoUrl, id, addLog);

        addLog('Preparing files for upload...');
        const allFilePaths = await getFiles(clonePath);

        const filesForDeployment = [];
        const filesToUpload = [];

        for (const filePath of allFilePaths) {
            const data = await fs.readFile(filePath);
            const sha = computeSHA(data);
            const size = data.length;
            const relativePath = path.relative(clonePath, filePath).replace(/\\/g, '/');

            filesForDeployment.push({ file: relativePath, sha, size });
            filesToUpload.push({ sha, size, data, file: relativePath });
        }
        addLog(`Found ${filesForDeployment.length} files to process.`);

        setStatus(DeploymentStatus.DEPLOYING);

        const BATCH_SIZE = 5;
        for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
            const batch = filesToUpload.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (f) => {
                const res = await fetch('https://api.vercel.com/v2/files', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${d.authToken}`,
                        'Content-Type': 'application/octet-stream',
                        'x-vercel-digest': f.sha,
                        'Content-Length': f.size
                    },
                    body: f.data
                });
                if (!res.ok && res.status !== 200) console.error(`Upload failed for ${f.file}`);
            }));
        }

        addLog('All files uploaded to Vercel storage.');
        saveData(); // Save logs checkpoint

        const projectName = d.repoUrl.split('/').pop().replace('.git', '');

        const payload = {
            name: projectName,
            files: filesForDeployment,
            projectSettings: { framework: null }
        };

        addLog('Initiating deployment...');
        const response = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${d.authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        if (!response.ok) throw new Error(`Vercel API Error: ${response.status}`);

        const data = JSON.parse(rawText);
        const deploymentId = data.id;
        const deploymentUrl = `https://${data.url}`;

        addLog(`Deployment initiated. ID: ${deploymentId}`);
        setStatus(DeploymentStatus.BUILDING);

        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < 60) {
            await sleep(3000);
            attempts++;
            const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
                headers: { 'Authorization': `Bearer ${d.authToken}` }
            });
            const statusData = await res.json();

            if (statusData.readyState === 'READY') {
                setStatus(DeploymentStatus.SUCCESS);
                addLog('Deployment completed successfully!');
                const dFinal = deployments.get(id);
                if (dFinal) {
                    dFinal.url = statusData.url ? `https://${statusData.url}` : deploymentUrl;
                    saveData();
                }
                isDone = true;
            } else if (statusData.readyState === 'ERROR' || statusData.readyState === 'CANCELED') {
                throw new Error('Vercel build failed.');
            } else {
                addLog(`Vercel Status: ${statusData.readyState}`);
            }
        }

    } catch (error) {
        console.error("Vercel Error:", error);
        setStatus(DeploymentStatus.FAILURE);
        addLog(`Error: ${error.message}`);
        saveData();
    }
}


async function processNetlifyDeployment(id) {
    const update = async (fn) => {
        await loadData();
        const d = deployments.get(id);
        if (d) { fn(d); deployments.set(id, d); }
    };
    const addLog = (msg) => {
        const d = deployments.get(id);
        if (d) d.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };
    const setStatus = (s) => {
        const d = deployments.get(id);
        if (d) {
            d.status = s;
            saveData();
        }
    };

    try {
        const d = deployments.get(id);
        setStatus(DeploymentStatus.CLONING);

        const repoName = d.repoUrl.split('/').pop().replace('.git', '');
        const clonePath = await cloneRepository(d.repoUrl, id, addLog);

        addLog('Zipping files for Netlify...');
        const zip = new AdmZip();
        const hasPackageJson = (await fs.readdir(clonePath)).includes('package.json');

        if (hasPackageJson) {
            addLog('Installing dependencies & building locally...');
            setStatus(DeploymentStatus.BUILDING);
            try {
                await execAsync('npm install', { cwd: clonePath });
                await execAsync('npm run build', { cwd: clonePath });

                const possibleDist = ['out', 'dist', 'build', '.next/server/pages'];
                let distFound = false;
                for (const dist of possibleDist) {
                    const distPath = path.join(clonePath, dist);
                    try {
                        await fs.access(distPath);
                        addLog(`Found build directory: ${dist}`);
                        zip.addLocalFolder(distPath);
                        distFound = true;
                        break;
                    } catch (e) { }
                }
                if (!distFound) {
                    addLog('Using root folder...');
                    zip.addLocalFolder(clonePath);
                }
            } catch (e) {
                addLog(`Build failed. Zipping source...`);
                zip.addLocalFolder(clonePath);
            }
        } else {
            zip.addLocalFolder(clonePath);
        }

        const zipBuffer = zip.toBuffer();
        addLog(`Created Zip archive.`);
        addLog(`Creating Netlify site (attempting name: ${repoName})...`);

        const createSite = async (namePayload) => {
            return await fetch('https://api.netlify.com/api/v1/sites', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${d.authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(namePayload)
            });
        };

        let siteRes = await createSite({ name: repoName });
        if (!siteRes.ok) {
            const errorText = await siteRes.text();
            addLog(`First attempt to create site '${repoName}' failed: ${siteRes.status} - ${errorText}`);
            console.warn(`Netlify create site (named) failed: ${siteRes.status} ${errorText}`);

            // Fallback to random name
            siteRes = await createSite({});
        }

        if (!siteRes.ok) {
            const errorText = await siteRes.text();
            throw new Error(`Could not create Netlify site ID. Status: ${siteRes.status}. Response: ${errorText}`);
        }

        const siteData = await siteRes.json();
        const siteId = siteData.id;

        addLog(`Site ready: ${siteData.name}. Uploading Zip...`);
        setStatus(DeploymentStatus.DEPLOYING);

        const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${d.authToken}`, 'Content-Type': 'application/zip' },
            body: zipBuffer
        });

        if (!deployRes.ok) throw new Error('Netlify Zip Upload failed');

        const deployData = await deployRes.json();
        addLog('Upload complete.');
        saveData();

        let isDone = false;
        while (!isDone) {
            await sleep(3000);
            const pollRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployData.id}`, { headers: { 'Authorization': `Bearer ${d.authToken}` } });
            const pollData = await pollRes.json();
            if (pollData.state === 'ready') {
                setStatus(DeploymentStatus.SUCCESS);
                const dFinal = deployments.get(id);
                if (dFinal) {
                    dFinal.url = pollData.ssl_url || pollData.url;
                    saveData();
                }
                isDone = true;
            } else if (pollData.state === 'error') {
                throw new Error('Processing failed.');
            } else {
                addLog(`Status: ${pollData.state}`);
            }
        }

    } catch (error) {
        console.error("Netlify Error:", error);
        setStatus(DeploymentStatus.FAILURE);
        addLog(`Error: ${error.message}`);
        saveData();
    }
}

async function simulateGenericDeployment(id) {
    // placeholder
} 
