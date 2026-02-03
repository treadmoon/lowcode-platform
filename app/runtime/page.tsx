"use client";

import { useEffect, useState } from 'react';
import { AppSchema } from '../../packages/schema/types';
import { MockDB } from '../../packages/mock-db';
import { StoreProvider } from '../../packages/state-core/store';
import { PageRenderer } from '../../packages/renderer';
import { LanguageProvider, useTranslation } from '../../packages/i18n';

function RuntimeContent() {
    const { t, language, setLanguage } = useTranslation();
    const [schema, setSchema] = useState<AppSchema | null>(null);

    useEffect(() => {
        MockDB.getSchema().then(setSchema);
    }, []);

    const toggleLang = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    if (!schema) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t('runtime.loading')}</div>;

    // For MVP, just render the first page found in schema
    const homePage = schema.pages[0];

    return (
        <StoreProvider initialState={schema.initialState}>
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-8 font-sans relative overflow-hidden">
                {/* Dot Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                {/* Runtime Header */}
                <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md border border-slate-200 rounded-full px-6 py-3 mb-8 flex justify-between items-center sticky top-4 z-50 shadow-sm">
                    <h1 className="text-sm font-bold tracking-wider text-slate-700 uppercase font-display">
                        {schema.initialState.title || t('runtime.title')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLang}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
                        >
                            {language.toUpperCase()}
                        </button>
                        <a
                            href="/studio"
                            className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-5 py-1.5 rounded-full transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 font-medium"
                        >
                            ← {t('runtime.back')}
                        </a>
                    </div>
                </div>

                {/* Page Content */}
                <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-3xl p-8 min-h-[600px] relative overflow-hidden border border-white shadow-xl">
                    <PageRenderer schema={homePage} />
                </div>
            </div>
        </StoreProvider>
    );
}

export default function RuntimePage() {
    return (
        <LanguageProvider>
            <RuntimeContent />
        </LanguageProvider>
    );
}
