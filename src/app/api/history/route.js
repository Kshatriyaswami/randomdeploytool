import { NextResponse } from 'next/server';
import { getAllDeployments, deleteDeployment } from '@/lib/deployment';

export async function GET() {
    const history = await getAllDeployments();
    return NextResponse.json({ history });
}

export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        deleteDeployment(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
