import { NextResponse } from 'next/server';
import { getDeployment } from '@/lib/deployment';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Deployment ID is required' }, { status: 400 });
    }

    const deployment = await getDeployment(id);

    if (!deployment) {
        return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json(deployment);
}
