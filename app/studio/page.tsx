"use client";

import { useEffect, useState } from 'react';
import { AppSchema } from '../../packages/schema/types';
import { MockDB } from '../../packages/mock-db';
import { StoreProvider } from '../../packages/state-core/store';
import { PageRenderer } from '../../packages/renderer';
import { LanguageProvider, useTranslation } from '../../packages/i18n';

function StudioContent() {
    const { t, language, setLanguage } = useTranslation();
    const [schema, setSchema] = useState<AppSchema | null>(null);
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    useEffect(() => {
        MockDB.getSchema().then(s => {
            setSchema(s);
            setJsonText(JSON.stringify(s, null, 2));
        });
    }, []);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonText(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setSchema(parsed);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSave = async () => {
        if (schema) {
            setSaveStatus(t('studio.saving'));
            await MockDB.saveSchema(schema);
            setSaveStatus(t('studio.saved'));
            setTimeout(() => setSaveStatus(null), 2000);
        }
    };

    const toggleLang = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    if (!schema) return <div className="flex items-center justify-center h-screen text-gray-500 animate-pulse">Initializing Studio...</div>;

    const activePage = schema.pages[0];

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-mono tracking-tight">
            {/* Sidebar / Editor */}
            <div className="w-1/2 flex flex-col border-r border-white/10 relative">
                {/* Toolbar */}
                <div className="h-14 border-b border-white/10 flex justify-between items-center px-6 bg-white/5 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <span className="ml-4 text-xs text-gray-400 font-bold uppercase">{t('studio.schema')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLang}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition"
                        >
                            {language.toUpperCase()}
                        </button>
                        <a
                            href="/runtime"
                            className="text-xs text-gray-400 hover:text-white transition uppercase font-bold tracking-wider"
                            target="_blank"
                        >
                            {t('studio.openRuntime')} ↗
                        </a>
                        <button
                            onClick={handleSave}
                            className="text-xs bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/50 px-4 py-1.5 rounded hover:bg-neon-indigo/30 transition shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        >
                            {saveStatus || t('studio.save')}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative bg-black/50">
                    <textarea
                        className="w-full h-full p-6 bg-transparent text-sm text-gray-300 resize-none focus:outline-none leading-relaxed selection:bg-neon-purple/30"
                        value={jsonText}
                        onChange={handleJsonChange}
                        spellCheck={false}
                    />
                    {error && (
                        <div className="absolute bottom-4 left-4 right-4 bg-red-900/80 text-red-100 p-3 text-xs rounded border border-red-500/30 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-2">
                            ⚠️ {t('studio.error')}: {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview */}
            <div className="w-1/2 flex flex-col h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black relative">
                <div className="h-14 border-b border-white/10 flex items-center px-6 bg-white/5">
                    <span className="text-xs text-gray-400 font-bold uppercase">{t('studio.preview')}</span>
                    <div className="ml-auto flex gap-2">
                        <div className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-400">{t('studio.desktop')}</div>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-auto flex items-center justify-center">
                    <StoreProvider key={JSON.stringify(schema.initialState)} initialState={schema.initialState}>
                        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-800 h-[600px] flex flex-col relative">
                            {/* Mock Browser Header */}
                            <div className="h-6 bg-gray-100 border-b flex items-center px-3 gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                            </div>
                            {/* Content */}
                            <div className="flex-1 overflow-auto bg-white text-black p-4">
                                <PageRenderer schema={activePage} />
                            </div>
                        </div>
                    </StoreProvider>
                </div>
            </div>
        </div>
    );
}

export default function StudioPage() {
    return (
        <LanguageProvider>
            <StudioContent />
        </LanguageProvider>
    );
}
