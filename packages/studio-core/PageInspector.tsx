"use client";

import React from 'react';
import { PageSchema } from '../schema/types';
import { SketchPicker } from 'react-color';
import {
    Settings,
    Trash2,
    PaintBucket,
    LayoutTemplate,
    Wand2,
    Loader2,
    Sparkles
} from 'lucide-react';
import { useTranslation } from '../i18n';

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
            <Icon size={14} className="text-primary-500" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{title}</h4>
            <div className="flex-1 h-[1px] bg-slate-100 ml-2" />
        </div>
        {children}
    </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[11px] text-slate-500 font-medium mb-1.5 block tracking-tight">{children}</label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        size={1}
        className="w-full bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-400 px-3 py-1.5 hover:border-slate-300 shadow-sm"
    />
);

const ColorPickerField = ({ label, value, onChange }: { label: string, value?: string, onChange: (val: string) => void }) => {
    const [show, setShow] = React.useState(false);
    return (
        <div className="relative space-y-1">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer shadow-sm relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwSDhWOFMwIDV6IiBmaWxsPSIjZWVlIi8+PHBhdGggZD0iTTggOEgwVjBTOFCA1eiIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==')]"
                    onClick={() => setShow(!show)}
                >
                    <div className="absolute inset-0" style={{ backgroundColor: value }} />
                </div>
                <Input
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="#FFFFFF"
                />
            </div>
            {show && (
                <div className="absolute left-0 top-full z-50 mt-2">
                    <div className="fixed inset-0" onClick={() => setShow(false)} />
                    <div className="relative shadow-xl rounded-lg overflow-hidden border border-slate-200">
                        <SketchPicker
                            color={value || '#fff'}
                            onChange={c => onChange(c.hex)}
                            disableAlpha
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const PageInspector = ({
    page,
    onUpdatePage,
    onClearElements
}: {
    page: PageSchema,
    onUpdatePage: (updates: Partial<PageSchema>) => void,
    onClearElements: () => void
}) => {
    const { t } = useTranslation();
    if (!page) return null;

    const handleChange = (key: string, value: any) => {
        onUpdatePage({
            props: {
                ...(page.props || {}),
                [key]: value
            }
        });
    };

    const [prompt, setPrompt] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleAIGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setError(null);
        try {
            const sysPrompt = `You are an expert Frontend Architect specializing in Tailwind CSS and React component structures.
Create a JSON representation of a React component tree using the EXACT interface below:
interface ComponentSchema {
  id: string; // must be unique, e.g. "comp-" + timestamp + random chars
  type: "Text" | "Button" | "Input" | "Container" | "Image" | "Card" | "Divider" | "Checkbox" | "Switch";
  props: Record<string, any>; // MUST include 'className' for utility classes (Tailwind). Do NOT use 'style' unless necessary. 
  // Component-specific props:
  // - Text: { content: "text", className: "text-lg font-bold text-slate-800", ... }
  // - Button: { text: "Click me", variant: "primary"|"secondary"|"outline"|"ghost", className: "w-full", ... }
  // - Container: { className: "p-4 flex flex-col gap-4 bg-white rounded-xl shadow-sm", ... }
  // - Input: { placeholder: "Enter text...", className: "border-slate-200", ... }
  // - Image: { src: "url", alt: "desc", className: "rounded-lg object-cover", ... }
  children?: ComponentSchema[]; // Only for 'Container' or 'Card'
}

RULES:
1. Return ONLY a valid JSON array of ComponentSchema objects representing the root layout.
2. DO NOT wrap the output in markdown code blocks like \`\`\`json ... \`\`\`. Just return the raw JSON array string.
3. Design modern, beautiful, highly-polished layouts. Use plenty of whitespace, subtle shadows, rounded borders, and professional color palettes (slate, indigo, primary).
4. For multi-column layouts, use Container with "flex flex-row gap-4". Ensure child elements distribute correctly (e.g., flex-1).
5. For complex layouts, always wrap them in an outer Container.`;
            const finalPrompt = `System: ${sysPrompt}\n\nUser Request: ${prompt}`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            if (response.ok) {
                const data = await response.json();
                let output = data.result || '';
                const firstBracket = output.indexOf('[');
                const lastBracket = output.lastIndexOf(']');

                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket >= firstBracket) {
                    const jsonStr = output.substring(firstBracket, lastBracket + 1);
                    const components = JSON.parse(jsonStr);
                    if (Array.isArray(components)) {
                        onUpdatePage({ components });
                        setPrompt('');
                    } else {
                        setError("AI did not return a valid array of components.");
                    }
                } else {
                    setError("AI could not generate a valid layout structure.");
                }
            } else {
                setError("Failed to fetch from AI service.");
            }
        } catch (err: any) {
            console.error("Layout validation error:", err);
            setError(err.message || "Invalid JSON from AI.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in duration-300">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center">
                        <LayoutTemplate size={16} className="text-primary-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-slate-800 tracking-tight">{t('pageInspector.title')}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">{t('pageInspector.rootElement')}</p>
                    </div>
                </div>
            </div>

            {/* Properties */}
            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                <Section title={t('pageInspector.aiAssistant')} icon={Wand2}>
                    <div className="space-y-3">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('pageInspector.promptPlaceholder')}
                            className="w-full h-24 text-[11px] p-2 bg-white border border-slate-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none shadow-sm placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleAIGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {isGenerating ? t('pageInspector.generating') : t('pageInspector.generateLayout')}
                        </button>
                        {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
                    </div>
                </Section>

                <Section title={t('pageInspector.appearance')} icon={PaintBucket}>
                    <ColorPickerField
                        label={t('pageInspector.backgroundColor')}
                        value={page.props?.backgroundColor || '#ffffff'}
                        onChange={v => handleChange('backgroundColor', v)}
                    />

                    <div className="mt-4">
                        <Label>{t('pageInspector.padding')}</Label>
                        <Input
                            placeholder="e.g. 16px, 2rem..."
                            value={page.props?.padding || '0px'}
                            onChange={e => handleChange('padding', e.target.value)}
                        />
                    </div>
                </Section>

                <Section title={t('pageInspector.dangerZone')} icon={Settings}>
                    <button
                        onClick={() => {
                            if (window.confirm(t('pageInspector.clearConfirm'))) {
                                onClearElements();
                            }
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors"
                    >
                        <Trash2 size={14} />
                        {t('pageInspector.clearElements')}
                    </button>
                </Section>
            </div>
        </div>
    );
};
