"use client";

import React from 'react';
import {
    Play,
    Save,
    Github,
    Monitor,
    Smartphone,
    Tablet,
    Code2,
    Undo2,
    Redo2,
    Download,
    Upload,
    Plus,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '../i18n';
import { PageSchema } from '../schema/types';

export const StudioHeader = ({
    pageTitle = "Untitled Page",
    onSave,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onExport,
    onImport,
    saveStatus,
    pages = [],
    activePageIndex = 0,
    onSwitchPage,
    onAddPage,
    onDeletePage,
    canvasWidth = '100%',
    onCanvasWidthChange
}: {
    pageTitle?: string,
    onSave?: () => void,
    onUndo?: () => void,
    onRedo?: () => void,
    canUndo?: boolean,
    canRedo?: boolean,
    onExport?: () => void,
    onImport?: () => void,
    saveStatus?: string | null,
    pages?: PageSchema[],
    activePageIndex?: number,
    onSwitchPage?: (index: number) => void,
    onAddPage?: () => void,
    onDeletePage?: (index: number) => void,
    canvasWidth?: string,
    onCanvasWidthChange?: (w: string) => void
}) => {
    const { t } = useTranslation();
    return (
        <header className="h-[var(--header-h)] border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-50 sticky top-0 w-full">
            {/* Left: Branding & Page Tabs */}
            <div className="flex items-center gap-3 min-w-0">
                <Link href="/" className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-md hover:shadow-lg transition-all shrink-0">
                    <Code2 size={18} className="text-white" />
                </Link>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {pages.map((page, i) => (
                        <div
                            key={page.id}
                            onClick={() => onSwitchPage?.(i)}
                            className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                                i === activePageIndex
                                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <span className="truncate max-w-[100px]">{page.path}</span>
                            {pages.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm(t('studio.deletePageConfirm'))) onDeletePage?.(i); }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={onAddPage}
                        className="p-1 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all shrink-0"
                        title={t('studio.addPage')}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Middle: Undo/Redo + Device Toggles */}
            <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={`${t('studio.undo')} (⌘Z)`}
                    >
                        <Undo2 size={14} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={`${t('studio.redo')} (⌘⇧Z)`}
                    >
                        <Redo2 size={14} />
                    </button>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                    {[
                        { w: '100%', icon: Monitor, label: 'Desktop' },
                        { w: '768px', icon: Tablet, label: 'Tablet' },
                        { w: '375px', icon: Smartphone, label: 'Mobile' },
                    ].map(({ w, icon: Icon, label }) => (
                        <button
                            key={w}
                            onClick={() => onCanvasWidthChange?.(w)}
                            className={`p-1.5 rounded-md transition-all ${canvasWidth === w ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                            title={label}
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {saveStatus && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                        {saveStatus}
                    </span>
                )}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onImport}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200"
                        title={t('studio.importSchema')}
                    >
                        <Upload size={14} className="text-slate-400" />
                        {t('studio.importSchema')}
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200"
                        title={t('studio.exportSchema')}
                    >
                        <Download size={14} className="text-slate-400" />
                        {t('studio.exportSchema')}
                    </button>
                </div>

                <div className="w-[1px] h-4 bg-slate-200" />

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

                <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                    <Github size={18} />
                </button>
            </div>
        </header>
    );
};
