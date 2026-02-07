import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { repoUrl } = await request.json();
        console.log('Received verification request for:', repoUrl);

        if (!repoUrl) {
            console.log('Error: Missing repoUrl');
            return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
        }

        // Validate GitHub URL format
        const githubRegex = /^https?:\/\/github\.com\/([\w-]+)\/([\w.-]+)(\/)?$/;
        const match = repoUrl.match(githubRegex);

        if (!match) {
            console.log('Error: Invalid URL format');
            return NextResponse.json({
                error: 'Invalid GitHub URL format. Expected: https://github.com/username/repo'
            }, { status: 400 });
        }

        const [, owner, repo] = match;
        console.log(`Checking GitHub API: https://api.github.com/repos/${owner}/${repo}`);

        // Check availability via GitHub API (GET to fetch details)
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'One-Click-Deploy-Tool'
            }
        });

        console.log('GitHub API Status:', response.status);

        if (response.status === 404) {
            return NextResponse.json({
                error: 'Repository not found or is private. Please ensure it is public.'
            }, { status: 404 });
        }

        if (!response.ok) {
            return NextResponse.json({
                error: 'Unable to verify repository accessibility.'
            }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            message: 'Repository is valid and public',
            details: {
                owner,
                repo,
                id: data.id,
                default_branch: data.default_branch
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
