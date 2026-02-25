"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { AppSchema } from '../schema/types';

export const AICopilotPanel = ({ schema }: { schema?: AppSchema }) => {
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
            const contextMsg = schema ? `当前页面组件:\n${JSON.stringify(schema.pages[0]?.components, null, 2)}` : '没有页面结构上下文。';
            const prompt = `用户请求: ${userMsg}\n\n当前页面上下文:\n${contextMsg}`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error("Network error");
            const data = await response.json();

            setMessages(prev => [...prev, { role: 'ai', content: data.result }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "抱歉，连接火山引擎时发生错误。" }]);
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
                                AI 助手 (火山引擎)
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 text-xs mt-10">
                                    你可以让我分析页面结构，或提出改进建议！
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
                                placeholder="输入消息..."
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
