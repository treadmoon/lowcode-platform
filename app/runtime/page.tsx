"use client";

import { useEffect, useState } from 'react';
import { AppSchema } from '../../packages/schema/types';
import { MockDB } from '../../packages/mock-db';
import { StoreProvider } from '../../packages/state-core/store';
import { PageRenderer } from '../../packages/renderer';

export default function RuntimePage() {
    const [schema, setSchema] = useState<AppSchema | null>(null);

    useEffect(() => {
        MockDB.getSchema().then(setSchema);
    }, []);

    if (!schema) return <div>Loading Runtime...</div>;

    // For MVP, just render the first page found in schema
    const homePage = schema.pages[0];

    return (
        <StoreProvider initialState={schema.initialState}>
            <div className="min-h-screen bg-black text-white flex flex-col items-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
                {/* Runtime Header */}
                <div className="w-full max-w-4xl glass-panel rounded-full px-6 py-3 mb-8 flex justify-between items-center sticky top-4 z-50">
                    <h1 className="text-sm font-bold tracking-wider text-gray-300 uppercase">
                        {schema.initialState.title || "Runtime Preview"}
                    </h1>
                    <a
                        href="/studio"
                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full transition text-gray-300"
                    >
                        ← Back to Studio
                    </a>
                </div>

                {/* Page Content */}
                <div className="w-full max-w-4xl glass-panel rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-neon-indigo to-neon-emerald opacity-50" />
                    <PageRenderer schema={homePage} />
                </div>
            </div>
        </StoreProvider>
    );
}
