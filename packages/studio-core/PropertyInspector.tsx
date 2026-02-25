"use client";

import React from 'react';
import { ComponentSchema } from '../schema/types';
import { SketchPicker } from 'react-color';
import Editor from '@monaco-editor/react';
import {
    Settings2,
    Layers,
    Palette,
    Trash2,
    ChevronDown,
    Info,
    LayoutTemplate,
    ArrowRight,
    ArrowDown,
    AlignVerticalSpaceAround,
    AlignVerticalJustifyCenter,
    AlignVerticalSpaceBetween,
    AlignHorizontalSpaceAround,
    AlignHorizontalJustifyCenter,
    AlignHorizontalSpaceBetween,
    AlignJustify,
    Component,
    Code,
    PaintBucket,
    Sparkles,
    Loader2,
    Check
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

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select
            {...props}
            className="w-full bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all appearance-none cursor-pointer px-3 py-1.5 hover:border-slate-300 shadow-sm"
        />
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
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

const CodeEditorField = ({ label, value, language, onChange, height = "200px", withAI = false }: { label: string, value: string, language: string, onChange: (val: string) => void, height?: string, withAI?: boolean }) => {
    const { t } = useTranslation();
    const [isPrompting, setIsPrompting] = React.useState(false);
    const [prompt, setPrompt] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleAIGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        try {
            let sysPrompt = `Generate ONLY valid ${language} code based on the user's request, with NO markdown formatting, NO explanation, NO code blocks. The code will be injected right into a ${language} editor.`;
            if (language === 'css') {
                sysPrompt += ` IMPORTANT: Use the exact string "selector" as your main CSS class/selector name. For example: selector { ... } selector:hover { ... }`;
            }
            if (language === 'javascript') {
                sysPrompt += ` IMPORTANT: You have access to three arguments in your scope: 'state' (current global JSON state), 'dispatch' (function to update state: dispatch({ type: 'UpdateState', path: 'string', value: any })), and 'navigate' (function(path: string)). DO NOT declare wrapper functions or import statements. Just write the raw JS body that runs when triggered. For example: dispatch({ type: 'UpdateState', path: 'count', value: (state.count || 0) + 1 });`;
            }
            const finalPrompt = `System: ${sysPrompt}\n\nUser Request: ${prompt}`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt }),
            });

            if (response.ok) {
                const data = await response.json();
                let code = data.result || '';
                if (code.startsWith('\`\`\`')) {
                    const lines = code.split('\\n');
                    lines.shift();
                    if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
                    code = lines.join('\\n');
                }
                onChange(code);
                setIsPrompting(false);
                setPrompt('');
            }
        } catch (error) {
            console.error("AI Generation Error", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                {withAI && (
                    <button
                        onClick={() => setIsPrompting(!isPrompting)}
                        className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md transition-all ${isPrompting ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`}
                    >
                        <Sparkles size={12} />
                        AI
                    </button>
                )}
            </div>

            {isPrompting && (
                <div className="flex gap-2 p-2 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100 rounded-md animate-in fade-in slide-in-from-top-2">
                    <input
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                        placeholder={language === 'css' ? t('inspector.aiCssPlaceholder') : t('inspector.aiJsPlaceholder')}
                        className="flex-1 text-[11px] px-2 py-1.5 bg-white border border-primary-100 rounded focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                    <button
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="shrink-0 px-2 flex items-center justify-center bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                </div>
            )}

            <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm relative group">
                {isGenerating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="flex bg-white shadow-lg border border-slate-100 px-3 py-1.5 rounded-full items-center gap-2 text-primary-600 text-[10px] font-bold uppercase tracking-widest">
                            <Sparkles size={12} className="animate-pulse" />
                            {t('inspector.generatingCode')}
                        </div>
                    </div>
                )}
                <Editor
                    height={height}
                    defaultLanguage={language}
                    language={language}
                    value={value}
                    onChange={(val) => onChange(val || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 11,
                        lineNumbers: 'off',
                        folding: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on'
                    }}
                />
            </div>
        </div>
    );
};

const JsonWrapper = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    const { t } = useTranslation();
    const [text, setText] = React.useState(JSON.stringify(value || {}, null, 2));

    // Sync when external value changes
    React.useEffect(() => {
        // Only update if parsed value is different to avoid cursor jumps, 
        // but here we just do simple check or assume user edit handles it.
        // For strict sync, we might need comparison.
        // Simplest: update text if it doesn't parse to the current value.
        try {
            const current = JSON.parse(text);
            if (JSON.stringify(current) !== JSON.stringify(value)) {
                setText(JSON.stringify(value || {}, null, 2));
            }
        } catch {
            if (!value) setText("{}");
        }
    }, [value]);

    const handleChange = (val: string) => {
        setText(val);
        try {
            const parsed = JSON.parse(val);
            onChange(parsed);
        } catch { }
    };

    return (
        <CodeEditorField
            label={t('inspector.customStyle')}
            value={text}
            language="json"
            onChange={handleChange}
        />
    );
};

export const PropertyInspector = ({
    component,
    onUpdate,
    onDelete
}: {
    component: ComponentSchema,
    onUpdate: (updates: Partial<ComponentSchema['props']>) => void,
    onDelete: (id: string) => void
}) => {
    const { t } = useTranslation();
    if (!component) return null;

    const handleChange = (key: string, value: any) => {
        onUpdate({ [key]: value });
    };

    return (
        <div className="h-full flex flex-col pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-5 flex-1 overflow-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{component.type}</h3>
                            <p className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-center w-fit mt-1 border border-slate-200 uppercase">{component.id.split('-')[1] || component.id}</p>
                        </div>
                    </div>
                </div>

                <Section title={t('inspector.properties')} icon={Layers}>
                    {component.type === 'Text' && (
                        <div className="space-y-1">
                            <Label>{t('inspector.content')}</Label>
                            <Input
                                value={component.props.content || ''}
                                onChange={e => handleChange('content', e.target.value)}
                            />
                        </div>
                    )}

                    {component.type === 'Button' && (
                        <div className="space-y-1">
                            <Label>{t('inspector.label')}</Label>
                            <Input
                                value={component.props.text || ''}
                                onChange={e => handleChange('text', e.target.value)}
                            />
                        </div>
                    )}

                    {component.type === 'Image' && (
                        <div className="space-y-3">
                            <div>
                                <Label>{t('inspector.src')}</Label>
                                <Input
                                    value={component.props.src || ''}
                                    onChange={e => handleChange('src', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>{t('inspector.width')}</Label>
                                <Input
                                    value={component.props.width || ''}
                                    onChange={e => handleChange('width', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {(component.type === 'Container') && (
                        <div className="space-y-3">
                            <div>
                                <Label>{t('inspector.direction')}</Label>
                                <Select
                                    value={component.props.direction || 'column'}
                                    onChange={e => handleChange('direction', e.target.value)}
                                >
                                    <option value="column">{t('inspector.options.column')}</option>
                                    <option value="row">{t('inspector.options.row')}</option>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('inspector.gap')}</Label>
                                <Input
                                    value={component.props.gap || ''}
                                    onChange={e => handleChange('gap', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>{t('inspector.padding')}</Label>
                                <Input
                                    value={component.props.padding || ''}
                                    onChange={e => handleChange('padding', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {component.type === 'Card' && (
                        <div>
                            <Label>{t('inspector.padding')}</Label>
                            <Input
                                value={component.props.padding || ''}
                                onChange={e => handleChange('padding', e.target.value)}
                            />
                        </div>
                    )}

                    {(component.type === 'Checkbox' || component.type === 'Switch') && (
                        <div className="space-y-3">
                            <div>
                                <Label>{t('inspector.label')}</Label>
                                <Input
                                    value={component.props.label || ''}
                                    onChange={e => handleChange('label', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>{t('inspector.initialState')}</Label>
                                <Select
                                    value={String(component.type === 'Checkbox' ? component.props.checked : component.props.active)}
                                    onChange={e => handleChange(component.type === 'Checkbox' ? 'checked' : 'active', e.target.value === 'true')}
                                >
                                    <option value="true">{t('inspector.options.true')}</option>
                                    <option value="false">{t('inspector.options.false')}</option>
                                </Select>
                            </div>
                        </div>
                    )}

                    {component.type === 'CustomComponent' && (
                        <div className="space-y-3">
                            <div>
                                <Label>名称 (Title)</Label>
                                <Input
                                    value={component.props.title || ''}
                                    placeholder="例如：AI 数据表格"
                                    onChange={e => handleChange('title', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>描述 (Description)</Label>
                                <Input
                                    value={component.props.description || ''}
                                    placeholder="对 AI 描述你想要的详细结构..."
                                    onChange={e => handleChange('description', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </Section>

                <Section title={t('inspector.layout')} icon={LayoutTemplate}>
                    {/* Display Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <Label>{t('inspector.flexLayout')}</Label>
                        <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                            <button
                                onClick={() => handleChange('style', { ...component.props.style, display: 'block' })}
                                className={`p - 1.5 rounded - md transition - all ${(!component.props.style?.display || component.props.style?.display === 'block') ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                title={t('inspector.options.block')}
                            >
                                <LayoutTemplate size={14} />
                            </button>
                            <button
                                onClick={() => handleChange('style', { ...component.props.style, display: 'flex' })}
                                className={`p - 1.5 rounded - md transition - all ${component.props.style?.display === 'flex' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                title={t('inspector.options.flex')}
                            >
                                <LayoutTemplate size={14} className="rotate-90" />
                            </button>
                        </div>
                    </div>

                    {component.props.style?.display === 'flex' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Direction & Wrap */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('inspector.direction')}</Label>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                                        {[
                                            { val: 'row', icon: ArrowRight, label: t('inspector.options.row') },
                                            { val: 'column', icon: ArrowDown, label: t('inspector.options.column') }
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => handleChange('style', { ...component.props.style, flexDirection: opt.val })}
                                                className={`flex - 1 flex items - center justify - center py - 1.5 rounded - md transition - all ${component.props.style?.flexDirection === opt.val ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                                title={opt.label}
                                            >
                                                <opt.icon size={14} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('inspector.options.wrap')}</Label>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                                        {[
                                            { val: 'nowrap', icon: Component, label: t('inspector.options.nowrap') },
                                            { val: 'wrap', icon: Layers, label: t('inspector.options.wrap') }
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => handleChange('style', { ...component.props.style, flexWrap: opt.val })}
                                                className={`flex - 1 flex items - center justify - center py - 1.5 rounded - md transition - all ${component.props.style?.flexWrap === opt.val ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                                title={opt.label}
                                            >
                                                <opt.icon size={14} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Alignment */}
                            <div>
                                <Label>{t('inspector.alignItems')}</Label>
                                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                                    {[
                                        { val: 'flex-start', icon: AlignVerticalSpaceAround, label: t('inspector.options.start') },
                                        { val: 'center', icon: AlignVerticalJustifyCenter, label: t('inspector.options.center') },
                                        { val: 'flex-end', icon: AlignVerticalSpaceBetween, label: t('inspector.options.end') },
                                        { val: 'stretch', icon: AlignJustify, label: t('inspector.options.stretch') }
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => handleChange('style', { ...component.props.style, alignItems: opt.val })}
                                            className={`flex - 1 flex items - center justify - center py - 1.5 rounded - md transition - all ${component.props.style?.alignItems === opt.val ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                            title={opt.label}
                                        >
                                            <opt.icon size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Justify */}
                            <div>
                                <Label>{t('inspector.justifyContent')}</Label>
                                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                                    {[
                                        { val: 'flex-start', icon: AlignHorizontalSpaceAround, label: t('inspector.options.start') },
                                        { val: 'center', icon: AlignHorizontalJustifyCenter, label: t('inspector.options.center') },
                                        { val: 'flex-end', icon: AlignHorizontalSpaceBetween, label: t('inspector.options.end') },
                                        { val: 'space-between', icon: AlignJustify, label: t('inspector.options.spaceBetween') }
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => handleChange('style', { ...component.props.style, justifyContent: opt.val })}
                                            className={`flex - 1 flex items - center justify - center py - 1.5 rounded - md transition - all ${component.props.style?.justifyContent === opt.val ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'} `}
                                            title={opt.label}
                                        >
                                            <opt.icon size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gap */}
                            <div>
                                <Label>{t('inspector.gap')}</Label>
                                <Input
                                    value={component.props.style?.gap || ''}
                                    placeholder="e.g. 1rem"
                                    onChange={e => handleChange('style', { ...component.props.style, gap: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </Section>

                <Section title={t('inspector.appearance')} icon={Palette}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <ColorPickerField
                            label="Background"
                            value={component.props.style?.backgroundColor}
                            onChange={(color) => handleChange('style', { ...component.props.style, backgroundColor: color })}
                        />
                        <ColorPickerField
                            label="Text Color"
                            value={component.props.style?.color}
                            onChange={(color) => handleChange('style', { ...component.props.style, color: color })}
                        />
                    </div>

                    <div className="space-y-1">
                        <JsonWrapper
                            value={component.props.style}
                            onChange={(newStyle) => handleChange('style', newStyle)}
                        />
                    </div>
                </Section>

                <Section title="AI 高级代码 (Text-to-Logic)" icon={Code}>
                    <div className="space-y-4">
                        <CodeEditorField
                            label="自定义 CSS"
                            value={component.props.customCss || ''}
                            language="css"
                            onChange={val => handleChange('customCss', val)}
                            withAI={true}
                        />
                        <CodeEditorField
                            label="自定义 JS (逻辑交互)"
                            value={component.props.customJs || ''}
                            language="javascript"
                            onChange={val => handleChange('customJs', val)}
                            withAI={true}
                        />
                    </div>
                </Section>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-8">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-600 leading-normal">
                        {t('inspector.msg_empty').replace('${state.path}', 'state.path')}
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                    onClick={() => onDelete(component.id)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-500 border border-slate-200 hover:border-red-200 hover:text-red-500 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] shadow-sm"
                >
                    <Trash2 size={14} />
                    {t('inspector.msg_delete')}
                </button>
            </div>
        </div>
    );
};
