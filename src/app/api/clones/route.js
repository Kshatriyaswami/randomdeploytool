import { NextResponse } from 'next/server';
import { getAllClones, deleteClone } from '@/lib/deployment';

export async function GET() {
    const clones = await getAllClones();
    return NextResponse.json({ clones });
}

export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        try {
            await deleteClone(id);
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
