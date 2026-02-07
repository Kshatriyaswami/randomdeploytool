import { NextResponse } from 'next/server';
import { createDeployment } from '@/lib/deployment';

export async function POST(request) {
    try {
        const { repoUrl, platform, authToken, repoId } = await request.json();

        if (!repoUrl || !platform || !authToken) {
            return NextResponse.json({ error: 'Repository URL, Platform, and Access Token are required' }, { status: 400 });
        }

        // Basic validation
        if (!repoUrl.includes('github.com')) {
            return NextResponse.json({ error: 'Only GitHub repositories are supported' }, { status: 400 });
        }

        const id = await createDeployment(repoUrl, platform, authToken, repoId);

        return NextResponse.json({ id, message: 'Deployment initiated' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
