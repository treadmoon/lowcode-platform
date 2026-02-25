import React, { useState } from 'react';
import { Database, Sparkles, Loader2, Save } from 'lucide-react';
import { AppSchema } from '../schema/types';
import Editor from '@monaco-editor/react';

export const StudioDataPanel = ({
    schema,
    onUpdateSchema
}: {
    schema: AppSchema,
    onUpdateSchema: (newSchema: AppSchema) => void
}) => {
    const [jsonStr, setJsonStr] = useState(JSON.stringify(schema.initialState, null, 2));
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Sync from props
    React.useEffect(() => {
        try {
            const current = JSON.parse(jsonStr);
            if (JSON.stringify(current) !== JSON.stringify(schema.initialState)) {
                setJsonStr(JSON.stringify(schema.initialState, null, 2));
            }
        } catch {
            // Wait for user to fix invalid json
        }
    }, [schema.initialState]);

    const handleSaveData = () => {
        try {
            const parsed = JSON.parse(jsonStr);
            onUpdateSchema({ ...schema, initialState: parsed });
            setError(null);
            setSuccessMsg("状态已保存 / State Saved!");
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        }
    };

    const handleAIGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const sysPrompt = `You are a mocked data generator. Generate purely valid JSON based on the user's data requirement.
CRITICAL RULES:
1. ONLY return a single valid JSON object. 
2. DO NOT wrap the JSON in Markdown formatting (no \`\`\`json). 
3. DO NOT include any explanatory text before or after the JSON.
4. The response MUST be parsed by JSON.parse() directly.
5. If the user asks for a list/array of items, return an object containing that array under a sensible key (e.g. {"users": [...]}). 
6. Merge this into the current state representation if appropriate, or just return the new data keys.

User's CURRENT JSON state: 
${jsonStr}`;

            const finalPrompt = `System: ${sysPrompt}\n\nUser Request: ${prompt}`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt }),
            });

            if (!response.ok) throw new Error("API request failed");
            const data = await response.json();

            let resultText = data.result || '{}';
            // Cleanup markdown if AI accidentally outputs it despite instructions
            if (resultText.startsWith('```')) {
                const lines = resultText.split('\n');
                lines.shift(); // remove first line (e.g., ```json)
                if (lines[lines.length - 1].startsWith('```')) lines.pop(); // remove last line
                resultText = lines.join('\n');
            }

            try {
                // Test parse
                const generatedJson = JSON.parse(resultText);
                const merged = { ...JSON.parse(jsonStr), ...generatedJson }; // Merge with existing
                setJsonStr(JSON.stringify(merged, null, 2));
                setSuccessMsg("数据生成成功！请点击保存");
                setTimeout(() => setSuccessMsg(null), 3000);
            } catch (parseError) {
                setError(`AI 返回了无效的 JSON 格式: ${resultText.substring(0, 50)}...`);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsGenerating(false);
            setPrompt('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
            {/* AI Generator Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                    <Database size={16} className="text-primary-600" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">AI 智能数据填充 / Mock Data</h3>
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100 rounded-lg p-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <p className="text-[11px] text-slate-600 mb-2 relative z-10 leading-relaxed">
                        描述你需要的数据结构和行数，AI 将自动覆盖生或合并到当前的全局 JSON 状态中。例如：<br />
                        <span className="font-mono text-primary-700 font-medium">&quot;生成 10 条科技公司员工的基础信息，包含 id, name, avatar, salary, role&quot;</span>
                    </p>
                    <div className="flex items-center gap-2 relative z-10 mt-3">
                        <input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                            placeholder="描述您的数据需求..."
                            className="flex-1 text-xs px-3 py-2 bg-white border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all placeholder:text-slate-400 shadow-sm"
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handleAIGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    生成中
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    一键生成
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* JSON Editor */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Global initialState</span>
                    <button
                        onClick={handleSaveData}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 hover:bg-primary-100 hover:text-primary-700 text-slate-600 px-3 py-1 rounded transition-colors"
                    >
                        <Save size={12} />
                        保存状态
                    </button>
                </div>

                {error && (
                    <div className="absolute top-10 left-4 right-4 z-20 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded shadow-md text-xs font-mono animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="absolute top-10 left-4 right-4 z-20 bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded shadow-md text-xs font-bold animate-in slide-in-from-top-2 flex items-center gap-2">
                        <Sparkles size={12} />
                        {successMsg}
                    </div>
                )}

                <Editor
                    height="100%"
                    language="json"
                    value={jsonStr}
                    onChange={(val) => setJsonStr(val || '{}')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        tabSize: 2
                    }}
                    className="pt-2"
                />
            </div>
        </div>
    );
};
