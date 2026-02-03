"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Play,
    Save,
    Github,
    Layers,
    Settings,
    Monitor,
    Code2,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '../i18n';

export const StudioHeader = ({
    pageTitle = "Untitled Page",
    onSave
}: {
    pageTitle?: string,
    onSave?: () => void
}) => {
    const { t } = useTranslation();
    return (
        <header className="h-[var(--header-h)] border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-50 sticky top-0 w-full">
            {/* Left: Branding & Breadcrumbs */}
            <div className="flex items-center gap-3">
                <Link href="/" className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-md hover:shadow-lg transition-all">
                    <Code2 size={18} className="text-white" />
                </Link>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">{t('studio.workspace')}</span>
                    <ChevronRight size={14} className="text-slate-400" />
                    <span className="text-slate-900 font-semibold tracking-tight">{pageTitle === "Untitled Page" ? t('studio.untitled') : pageTitle}</span>
                </div>
            </div>

            {/* Middle: Device Toggles */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                <button className="p-1.5 rounded-md bg-white text-primary-600 shadow-sm transition-all ring-1 ring-slate-200/50">
                    <Monitor size={14} />
                </button>
                <button className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 transition-all hover:bg-white/50">
                    <Settings size={14} />
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 transition-all border border-transparent hover:border-slate-200"
                    >
                        <Save size={14} className="text-slate-500" />
                        {t('studio.save')}
                    </button>

                    <Link
                        href="/runtime"
                        className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        <Play size={14} fill="currentColor" />
                        {t('studio.preview')}
                    </Link>
                </div>

                <div className="w-[1px] h-4 bg-slate-200 mx-2" />

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                    <Github size={18} />
                </button>
            </div>
        </header>
    );
};
