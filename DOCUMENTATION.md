# One-Click Deployment Tool - Project Documentation

## 1. Project Overview
The **One-Click Deployment Tool** is a Next.js application designed to simplify the deployment of **public GitHub repositories** to major hosting platforms like **Vercel** and **Netlify**.

Unlike standard integrations that require complex OAuth setups or Git permissions, this tool uses a **"Local Clone & Deploy" architecture**. It acts as a bridge: downloading the source code to a temporary server environment and then pushing it directly to the cloud provider's API.

---

## 2. Architecture & Workflow

### Core Workflow: "Clone & Deploy"
1.  **User Input**: User provides a GitHub URL and a Platform Access Token (PAT).
2.  **Verification**: The tool verifies the repository is public and accessible via the GitHub API.
3.  **Cloning**: The backend (`lib/deployment.js`) uses `git clone` to download the repository to a temporary directory on the server (e.g., `%TEMP%/deploy-xyz`).
4.  **Processing**:
    -   **For Vercel**: The tool reads all files, computes SHA1 hashes, and prepares them for an iterative upload.
    -   **For Netlify**: The tool installs dependencies, attempts a local build (if `package.json` exists), and zips the output (or the source code) into a deployable archive.
5.  **Deployment**:
    -   **Vercel**: Uploads individual files via `/v2/files` and creates a deployment via `/v13/deployments`.
    -   **Netlify**: Uploads the zip archive via `/api/v1/sites/{siteId}/deployment`.
6.  **Polling**: The tool polls the provider's API until the deployment state is `READY` or `ERROR`.

---

## 3. Module Breakdown

### A. Frontend (`src/app` & `src/components`)
Responsible for user interaction, real-time validation, and status display.

#### `src/components/DeploymentForm.js`
-   **Purpose**: Captures user input (Repo URL, Platform, Token).
-   **Key Features**:
    -   **Real-time Validation**: Debounced calls to `/api/verify-repo` to check URL validity as the user types.
    -   **Dynamic Fields**: Shows "Access Token" input based on selected platform.
    -   **Feedback**: Displays success/error icons and validation messages.

#### `src/app/page.js`
-   **Purpose**: Main controller component.
-   **Key Functions**:
    -   `handleDeploy`: Orchestrates the deployment request to the backend.
    -   `fetchHistory`: Loads past deployments.
    -   `useEffect` (Polling): Sets up an interval to poll `/api/deployment-status` for live log updates.

### B. Backend API Routes (`src/app/api`)
Serverless functions that handle requests from the frontend.

#### `POST /api/verify-repo`
-   **Input**: `{ repoUrl: string }`
-   **Logic**: Sends a `GET` request to GitHub API (`https://api.github.com/repos/...`).
-   **Output**: Returns `success: true` and repository details (ID, default branch) if public; otherwise returns error.

#### `POST /api/deploy`
-   **Input**: `{ repoUrl, platform, authToken, repoId }`
-   **Logic**: Calls `createDeployment` in the core library to start the background process.
-   **Output**: Returns a `deploymentId` for tracking.

### C. Core Logic (`src/lib/deployment.js`)
The heart of the application. Contains the deployment logic and in-memory state.

#### Data Structures
-   `deployments` (Map): An in-memory store of active and past deployments. *Note: Resets on server restart.*

#### Key Functions
1.  **`createDeployment(repoUrl, platform, ...)`**: Initializes a deployment record and starts the async process.
2.  **`cloneRepository(repoUrl, id)`**:
    -   Uses `child_process.exec` to run `git clone <url> <temp_dir>`.
    -   Returns the path to the temporary directory.
3.  **`processVercelDeployment(id)`**:
    -   **File Processing**: Recursively reads files from the cloned directory.
    -   **SHA Computation**: generated SHA1 hashes for Vercel's deduplication system.
    -   **Batch Upload**: Uploads files to `https://api.vercel.com/v2/files`.
    -   **Trigger**: Calls `https://api.vercel.com/v13/deployments` linking the uploaded files.
4.  **`processNetlifyDeployment(id)`**:
    -   **Build**: Checks for `package.json`. If found, runs `npm install && npm run build`.
    -   **Zipping**: Uses `adm-zip` to archive the build output (or source).
    -   **Upload**: Sends the binary zip data to `https://api.netlify.com/api/v1/sites/.../deploys`.

---

## 4. API Reference (Internal)

| Endpoint | Method | Params | Description |
| :--- | :--- | :--- | :--- |
| `/api/verify-repo` | POST | `repoUrl` | Validates GitHub repo & fetches ID. |
| `/api/deploy` | POST | `repoUrl`, `platform`, `token` | OTP to start deployment process. |
| `/api/deployment-status` | GET | `id` | Returns current status, logs, and live URL. |
| `/api/history` | GET | - | Returns list of all past deployments. |

---

## 5. Dependencies
-   **Next.js**: Framework.
-   **adm-zip**: For creating zip archives (Netlify).
-   **simple-git** (or system `git`): For cloning repositories.
-   **Lucide React**: For UI icons.
