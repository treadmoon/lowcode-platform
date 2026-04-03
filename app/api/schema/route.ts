import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const SCHEMA_FILE = path.join(DATA_DIR, 'schema.json');

async function ensureDataDir() {
    try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function GET() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(SCHEMA_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch {
        return NextResponse.json(null, { status: 404 });
    }
}

export async function PUT(req: Request) {
    try {
        await ensureDataDir();
        const body = await req.json();
        await fs.writeFile(SCHEMA_FILE, JSON.stringify(body, null, 2), 'utf-8');
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
