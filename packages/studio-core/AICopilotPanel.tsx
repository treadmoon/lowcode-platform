"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { AppSchema, ComponentSchema } from '../schema/types';
import { useTranslation } from '../i18n';

export const AICopilotPanel = ({ schema, onUpdatePage }: { schema?: AppSchema, onUpdatePage?: (components: ComponentSchema[]) => void }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            // Provide schema context to AI
            const sysInstruction = `You are an AI assistant in a low-code platform. You can answer normal questions in Chinese. 
IMPORTANT: IF the user asks you to generate a layout, build a form, add components, or create a page, you MUST reply ONLY with a valid JSON array of ComponentSchema objects representing the root layout, and NO other text before or after, NO markdown blocks.

interface ComponentSchema {
  id: string; // must be unique
  type: "Text" | "Button" | "Input" | "Container" | "Image" | "Card" | "Divider" | "Checkbox" | "Switch";
  props: Record<string, any>; // MUST include 'className' for utility classes (Tailwind). Do NOT use 'style' unless necessary. Use padding, flex, bg-colors, rounded corners, shadows.
  children?: ComponentSchema[]; // only for Container or Card
}

RULES for layouts:
1. Design modern, beautiful, highly-polished layouts. Use plenty of whitespace, subtle shadows, rounded borders, and professional color palettes (slate, indigo, primary).
2. For multi-column layouts, use Container with "flex flex-row gap-4". 
3. Wrap main content in a parent Container to manage spacing (e.g. "p-6 flex flex-col gap-6 bg-slate-50 min-h-screen").`;
            const contextMsg = schema ? `当前页面组件:\n${JSON.stringify(schema.pages[0]?.components, null, 2)}` : '没有页面结构上下文。';
            const prompt = `System: ${sysInstruction}\n\n当前页面上下文:\n${contextMsg}\n\n用户请求: ${userMsg}`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error("Network error");
            const data = await response.json();

            let outputStr = data.result || '';
            const firstBracket = outputStr.indexOf('[');
            const lastBracket = outputStr.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket >= firstBracket) {
                try {
                    const jsonStr = outputStr.substring(firstBracket, lastBracket + 1);
                    const parsedComponents = JSON.parse(jsonStr);
                    if (Array.isArray(parsedComponents) && onUpdatePage) {
                        onUpdatePage(parsedComponents);
                        setMessages(prev => [...prev, { role: 'ai', content: t('aiCopilot.layoutApplied') }]);
                        return;
                    }
                } catch (err) {
                    // Not valid json array, just show as text
                }
            }

            setMessages(prev => [...prev, { role: 'ai', content: data.result }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: t('aiCopilot.networkError') }]);
        } finally {
            setIsLoading(false);
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
                        className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[450px]"
                    >
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <Sparkles size={16} />
                                {t('aiCopilot.title')}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 text-xs mt-10">
                                    {t('aiCopilot.defaultGreeting')}
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                        <Bot size={12} />
                                    </div>
                                    <div className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-400 flex items-center gap-1">
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder={t('aiCopilot.inputPlaceholder')}
                                className="flex-1 text-xs px-3 py-2 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all ${isOpen ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-primary-500/50 text-white hover:scale-105'}`}
            >
                {isOpen ? <X size={20} /> : <Sparkles size={20} />}
            </button>
        </div>
    );
};
