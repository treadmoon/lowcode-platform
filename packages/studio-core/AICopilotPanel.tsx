"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Check, Eye, ChevronDown, ChevronUp, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import { AppSchema, ComponentSchema } from '../schema/types';
import { sanitizeComponents, validateComponent } from '../schema/validate';
import { useTranslation } from '../i18n';

// System prompt with shot examples for stable output
const SYSTEM_INSTRUCTION = `你是一个低代码平台中的智能 AI 助手，参考 Ant Design 设计风格生成组件。

【重要】你可以使用的组件类型只有这些：
- Text: 文本内容，用 content 属性指定文字内容
- Button: 按钮，用 text 属性指定按钮文字
- Input: 输入框，用 placeholder 属性指定占位符
- Image: 图片，用 src 属性指定图片地址
- Container: 容器，可嵌套其他组件，用 children 属性放置子组件
- Card: 卡片容器，可嵌套其他组件
- Divider: 分隔线
- Checkbox: 复选框
- Switch: 开关

【重要】不要生成 Carousel、Swiper、Modal、Tabs 等复合组件类型，这些不受支持。

【Ant Design 风格指南】

1. 按钮 (Button)：
   - 主按钮：bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700
   - 次按钮：bg-white text-slate-700 border border-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-50
   - 危险按钮：bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700

2. 卡片 (Card)：
   - 整体：bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden
   - 头部：px-6 py-4 border-b border-slate-100 font-semibold text-slate-900
   - 内容区：px-6 py-5 text-slate-700
   - 圆角：rounded-xl (12px)

3. 输入框 (Input)：
   - 整体：w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm
   - 聚焦：ring-2 ring-blue-500/30 border-blue-500
   - 占位符：text-slate-400

4. 页面布局 Container：
   - 页面：min-h-screen bg-slate-50
   - 内容区：max-w-6xl mx-auto px-6 py-8
   - 区块间距：mb-8 或 gap-6

5. 文字排版 (Text)：
   - 标题：text-2xl font-semibold text-slate-900
   - 副标题：text-base text-slate-500
   - 正文：text-sm text-slate-700 leading-relaxed
   - 辅助文字：text-xs text-slate-400

6. 图片 (Image)：
   - 圆角：rounded-lg或rounded-xl
   - 阴影：shadow-sm

【示例 1 - 典型页面布局】
[{"id":"page","type":"Container","props":{"className":"min-h-screen bg-slate-50"},"children":[{"id":"header","type":"Container","props":{"className":"bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"},"children":[{"id":"title","type":"Text","props":{"className":"text-lg font-semibold text-slate-900","content":"仪表盘"}},{"id":"actions","type":"Container","props":{"className":"flex gap-3"},"children":[{"id":"btn1","type":"Button","props":{"className":"bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700","text":"新建"}},{"id":"btn2","type":"Button","props":{"className":"bg-white text-slate-700 border border-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-50","text":"导出"}}]}}]},{"id":"content","type":"Container","props":{"className":"max-w-6xl mx-auto px-6 py-8"},"children":[{"id":"card1","type":"Card","props":{"className":"bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"},"children":[{"id":"card1header","type":"Text","props":{"className":"px-6 py-4 border-b border-slate-100 font-semibold text-slate-900","content":"数据概览"}},{"id":"card1body","type":"Container","props":{"className":"px-6 py-5"},"children":[{"id":"stat","type":"Text","props":{"className":"text-3xl font-bold text-slate-900","content":"1,234"}},{"id":"statlabel","type":"Text","props":{"className":"text-sm text-slate-500 mt-1","content":"总用户数"}}]}}]}]}}]}]

【示例 2 - 表单页面】
[{"id":"page","type":"Container","props":{"className":"min-h-screen bg-slate-50 py-8"},"children":[{"id":"card","type":"Card","props":{"className":"max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"},"children":[{"id":"title","type":"Text","props":{"className":"px-6 py-4 border-b border-slate-100 font-semibold text-slate-900 text-lg","content":"用户登录"}},{"id":"form","type":"Container","props":{"className":"px-6 py-6 space-y-4"},"children":[{"id":"label1","type":"Text","props":{"className":"text-sm font-medium text-slate-700 mb-1","content":"用户名"}},{"id":"input1","type":"Input","props":{"placeholder":"请输入用户名","className":"w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"}},{"id":"label2","type":"Text","props":{"className":"text-sm font-medium text-slate-700 mb-1","content":"密码"}},{"id":"input2","type":"Input","props":{"placeholder":"请输入密码","className":"w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"}},{"id":"btn","type":"Button","props":{"className":"w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 mt-4","text":"登录"}}]}}]}]}]

RULES:
1. 不要添加任何 Markdown 代码块标记
2. 只回复纯 JSON 格式
3. 使用 Ant Design 风格的 Tailwind 类名
4. 组件要有合理的 padding、margin、间距
5. 颜色使用 slate 系列（slate-50 到 slate-900）
6. 主色调使用 blue-600
7. 卡片使用 rounded-xl + shadow-sm + border`;

// Lightweight component renderer for preview
const renderComponentPreview = (comp: ComponentSchema, depth = 0): React.ReactNode => {
    switch (comp.type) {
        case 'Text':
            return (
                <div key={comp.id} className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {comp.props?.content || '文本'}
                </div>
            );
        case 'Button':
            return (
                <button key={comp.id} className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg shadow-sm text-sm">
                    {comp.props?.text || '按钮'}
                </button>
            );
        case 'Input':
            return (
                <input key={comp.id} className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 max-w-[200px]" placeholder={comp.props?.placeholder || '输入...'} readOnly />
            );
        case 'Image':
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={comp.id} src={comp.props?.src || "https://placehold.co/100x100"} alt="preview" className="rounded-lg object-cover" style={{ width: comp.props?.width || '100px', height: comp.props?.height || '100px' }} />
            );
        case 'Container':
            return (
                <div key={comp.id} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="text-[10px] text-slate-400 mb-2 font-mono">Container</div>
                    {comp.children?.map(child => renderComponentPreview(child, depth + 1))}
                    {(!comp.children || comp.children.length === 0) && (
                        <div className="text-slate-300 text-xs">空容器</div>
                    )}
                </div>
            );
        case 'Card':
            return (
                <div key={comp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="text-[10px] text-slate-400 mb-2 p-3 pb-0 font-mono">Card</div>
                    {comp.children?.map(child => <div key={child.id} className="p-3 pt-1">{renderComponentPreview(child, depth + 1)}</div>)}
                    {(!comp.children || comp.children.length === 0) && (
                        <div className="text-slate-300 text-xs p-3">空卡片</div>
                    )}
                </div>
            );
        case 'Divider':
            return <div key={comp.id} className="w-full" style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />;
        case 'Checkbox':
            return (
                <label key={comp.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="w-4 h-4 border rounded bg-white border-slate-300" />
                    <span>{comp.props?.label || '选项'}</span>
                </label>
            );
        case 'Switch':
            return (
                <div key={comp.id} className="flex items-center justify-between text-sm text-slate-700" style={{ maxWidth: '150px' }}>
                    <span>{comp.props?.label || '开关'}</span>
                    <div className="w-9 h-5 bg-slate-200 rounded-full relative">
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                </div>
            );
        case 'CustomComponent':
            return (
                <div key={comp.id} className="border-2 border-dashed border-primary-300 bg-primary-50/30 p-4 rounded-xl">
                    <div className="text-primary-500 text-xs font-semibold">✨ {comp.props?.title || 'AI 组件'}</div>
                    {comp.props?.description && <p className="text-[10px] text-slate-500 mt-1">{comp.props.description}</p>}
                    {comp.props?.originalType && (
                        <div className="text-[10px] text-amber-600 mt-1 italic">原类型: {comp.props.originalType}</div>
                    )}
                    {comp.children && comp.children.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-primary-200">
                            {comp.children.map(child => renderComponentPreview(child))}
                        </div>
                    )}
                </div>
            );
        default:
            if (comp.children && comp.children.length > 0) {
                return (
                    <div key={comp.id} className="p-3 border border-dashed border-amber-300 rounded-lg bg-amber-50/50">
                        <div className="text-amber-600 text-[10px] font-semibold mb-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            {comp.type} → CustomComponent
                        </div>
                        {comp.children.map(child => renderComponentPreview(child))}
                    </div>
                );
            }
            return (
                <div key={comp.id} className="p-2 border border-dashed border-red-300 rounded bg-red-50 text-red-500 text-xs">
                    不支持: {comp.type}
                </div>
            );
    }
};

// Inline Component Preview Card (non-blocking)
const ComponentPreviewCard = ({
    components,
    onApply,
    onDiscard,
    isGenerating = false
}: {
    components: ComponentSchema[];
    onApply: () => void;
    onDiscard: () => void;
    isGenerating?: boolean;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-xs font-semibold text-slate-700">
                        {isGenerating ? '正在生成组件...' : '已生成组件'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                        {components.length} 个组件
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>
            </div>

            {/* Preview Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-slate-50 max-h-[300px] overflow-auto">
                            <div className="space-y-3">
                                {components.map((comp) => (
                                    <div key={comp.id} className="bg-white rounded-lg border border-slate-200 p-4">
                                        {renderComponentPreview(comp)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            {!isGenerating && (
                <div className="px-4 py-3 bg-white border-t border-slate-100 flex gap-2 justify-end">
                    <button
                        onClick={onDiscard}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Trash2 size={12} />
                        忽略
                    </button>
                    <button
                        onClick={onApply}
                        className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Plus size={12} />
                        添加到页面
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export const AICopilotPanel = ({ schema, onUpdatePage, onAddCustomComponent, onUpdateCustomComponent }: { schema?: AppSchema, onUpdatePage?: (components: ComponentSchema[]) => void, onAddCustomComponent?: (component: ComponentSchema, name: string) => void, onUpdateCustomComponent?: (name: string, component: ComponentSchema) => void }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [previewComponents, setPreviewComponents] = useState<ComponentSchema[] | null>(null);
    const [previewAction, setPreviewAction] = useState<'page' | 'custom' | 'update' | null>(null);
    const [previewName, setPreviewName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [streamingDone, setStreamingDone] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, streamingContent, isOpen, previewComponents, scrollToBottom]);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setStreamingContent('');
        setStreamingDone(false);
    };

    // Convert unsupported component types to CustomComponent
    const convertToSupported = (comp: ComponentSchema): ComponentSchema => {
        const validTypes = new Set(['Text', 'Button', 'Input', 'Container', 'Image', 'Card', 'Divider', 'Checkbox', 'Switch', 'CustomComponent']);
        if (validTypes.has(comp.type)) {
            return {
                ...comp,
                children: comp.children?.map(convertToSupported)
            };
        }
        return {
            id: comp.id,
            type: 'CustomComponent',
            props: {
                ...comp.props,
                title: comp.props?.title || `${comp.type} 组件`,
                originalType: comp.type
            },
            children: comp.children?.map(convertToSupported)
        };
    };

    const handleApplyPreview = () => {
        if (!previewComponents) return;

        const convertedComponents = previewComponents.map(convertToSupported);

        if (previewAction === 'page' && onUpdatePage) {
            onUpdatePage(convertedComponents);
            setMessages(prev => [...prev, { role: 'ai', content: t('aiCopilot.layoutApplied') }]);
        } else if (previewAction === 'custom' && onAddCustomComponent) {
            onAddCustomComponent(convertedComponents[0], previewName);
            setMessages(prev => [...prev, { role: 'ai', content: `已添加到组件库：【${previewName}】` }]);
        }

        setPreviewComponents(null);
        setPreviewAction(null);
        setPreviewName('');
    };

    const handleDiscardPreview = () => {
        setPreviewComponents(null);
        setPreviewAction(null);
        setPreviewName('');
    };

    // Parse and extract components from AI response
    const parseComponents = useCallback((content: string): ComponentSchema[] | null => {
        const firstBracket = content.indexOf('[');
        const lastBracket = content.lastIndexOf(']');
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBracket !== -1 || firstBrace !== -1) {
            try {
                const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBrace > firstBracket);
                if (isArray) {
                    const jsonStr = content.substring(firstBracket, lastBracket + 1);
                    let parsedComponents = sanitizeComponents(JSON.parse(jsonStr));
                    if (parsedComponents.length === 0) {
                        try {
                            const raw = JSON.parse(jsonStr);
                            const arr = Array.isArray(raw) ? raw : [raw];
                            parsedComponents = arr.filter((c: any) => c && c.id && c.type).map((c: any) => ({
                                id: c.id,
                                type: c.type as ComponentSchema['type'],
                                props: c.props || {},
                                children: c.children
                            }));
                        } catch {
                            // Ignore
                        }
                    }
                    return parsedComponents.length > 0 ? parsedComponents : null;
                } else {
                    const jsonStr = content.substring(firstBrace, lastBrace + 1);
                    const parsedData = JSON.parse(jsonStr);
                    if (parsedData?.id && parsedData?.type) {
                        return [parsedData];
                    }
                    if (parsedData?.intent === 'create_reusable' && parsedData?.component) {
                        return [parsedData.component];
                    }
                }
            } catch {
                // Not valid JSON yet
            }
        }
        return null;
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);
        setStreamingContent('');
        setStreamingDone(false);
        setPreviewComponents(null);
        inputRef.current?.focus();

        try {
            const contextMsg = schema ? `当前页面组件:\n${JSON.stringify(schema.pages[0]?.components, null, 2)}` : '没有页面结构上下文。';
            const prompt = `${SYSTEM_INSTRUCTION}\n\n当前页面上下文:\n${contextMsg}\n\n用户请求: ${userMsg}`;

            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    messages: messages,
                    stream: true,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok || !response.body) {
                const data = await response.json();
                const errorMsg = data.message || data.error || t('aiCopilot.networkError');
                setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
                setIsLoading(false);
                return;
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let hasDetectedComponents = false;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            if (data.done) break;
                            if (data.content) {
                                fullContent += data.content;
                                setStreamingContent(fullContent);

                                // Try to detect components while streaming
                                if (!hasDetectedComponents && fullContent.length > 50) {
                                    const detected = parseComponents(fullContent);
                                    if (detected && detected.length > 0) {
                                        hasDetectedComponents = true;
                                        setPreviewComponents(detected);
                                        setPreviewAction('page');
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (streamError: any) {
                if (streamError.name === 'AbortError') {
                    setStreamingContent('');
                    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'ai', content: '(已取消)' }]);
                    setIsLoading(false);
                    return;
                }
            }

            setStreamingDone(true);
            setStreamingContent('');

            // Final parse - check if we already have preview, otherwise add as regular message
            const finalParsed = parseComponents(fullContent);
            if (finalParsed && finalParsed.length > 0) {
                if (!previewComponents) {
                    setPreviewComponents(finalParsed);
                    setPreviewAction('page');
                }
            } else if (fullContent.trim()) {
                setMessages(prev => [...prev, { role: 'ai', content: fullContent }]);
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                setMessages(prev => [...prev, { role: 'ai', content: '(已取消)' }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: t('aiCopilot.networkError') }]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <Sparkles size={18} />
                                {t('aiCopilot.title')}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                                aria-label={t('aiCopilot.closeAI')}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages area */}
                        <div
                            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50"
                            role="log"
                            aria-live="polite"
                        >
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 text-xs py-10">
                                    <div className="mb-3">
                                        <Wand2 size={32} className="mx-auto text-primary-300" />
                                    </div>
                                    {t('aiCopilot.defaultGreeting')}
                                </div>
                            )}

                            {/* Component Preview Card - Inline, non-blocking */}
                            <AnimatePresence>
                                {previewComponents && (
                                    <ComponentPreviewCard
                                        components={previewComponents}
                                        onApply={handleApplyPreview}
                                        onDiscard={handleDiscardPreview}
                                        isGenerating={isLoading && !streamingDone}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Chat Messages */}
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-lg' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-lg'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming indicator */}
                            {isLoading && streamingContent && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                        <Bot size={14} />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-lg bg-white border border-slate-200 text-slate-700 max-w-[85%]">
                                        <span className="whitespace-pre-wrap">{streamingContent}</span>
                                        <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
                                    </div>
                                </div>
                            )}

                            {/* Thinking indicator */}
                            {isLoading && !streamingContent && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                        <Bot size={14} />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-lg bg-white border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Loader2 size={14} className="animate-spin" />
                                            {t('aiCopilot.thinking')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
                                    placeholder={t('aiCopilot.inputPlaceholder')}
                                    className="flex-1 text-sm px-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                                    disabled={isLoading}
                                />
                                {isLoading ? (
                                    <button
                                        onClick={handleCancel}
                                        className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                        aria-label={t('aiCopilot.cancel')}
                                    >
                                        <X size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                        aria-label={t('aiCopilot.send')}
                                    >
                                        <Send size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isOpen ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-gradient-to-br from-primary-600 to-indigo-600 hover:shadow-primary-500/50 text-white hover:scale-105'}`}
                aria-label={isOpen ? t('aiCopilot.closeAI') : t('aiCopilot.openAI')}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </div>
    );
};
