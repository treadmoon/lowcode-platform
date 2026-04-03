"use client";

import React from 'react';
import { ComponentSchema } from '../schema/types';
import { interpolateProps } from '../lib/interpolation';

export type RenderMode = 'studio' | 'runtime';

export interface BaseComponentContentProps {
    component: ComponentSchema;
    stateData: Record<string, any>;
    mode: RenderMode;
    renderChildren?: (children: ComponentSchema[]) => React.ReactNode;
    onEvent?: (flowId?: string) => void;
    emptyContainerText?: string;
    emptyCardText?: string;
}

export const BaseComponentContent = ({
    component,
    stateData,
    mode,
    renderChildren,
    onEvent,
    emptyContainerText = 'Drop Here',
    emptyCardText = 'Card Content',
}: BaseComponentContentProps) => {
    const interpolatedProps = React.useMemo(
        () => interpolateProps(component.props, stateData),
        [component.props, stateData]
    );

    const isStudio = mode === 'studio';
    const children = component.children;
    const hasChildren = children && children.length > 0;

    switch (component.type) {
        case 'Text':
            return (
                <div style={interpolatedProps.style} className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {interpolatedProps.content}
                </div>
            );

        case 'Button':
            return (
                <button
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-all duration-200 active:scale-95 border-none text-sm ${isStudio ? 'pointer-events-none' : ''}`}
                    style={interpolatedProps.style}
                    onClick={isStudio ? undefined : (e) => {
                        e.stopPropagation();
                        onEvent?.(component.onEvent?.click);
                    }}
                >
                    <span>{interpolatedProps.text}</span>
                </button>
            );

        case 'Input':
            return (
                <input
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block p-2.5 transition-all outline-none placeholder:text-slate-400 shadow-sm"
                    style={interpolatedProps.style}
                    value={!isStudio && component.bindState ? stateData[component.bindState] : ''}
                    placeholder={interpolatedProps.placeholder}
                    readOnly={isStudio}
                />
            );

        case 'Image':
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={interpolatedProps.src || "https://placehold.co/100x100"}
                    alt={interpolatedProps.alt || "Image"}
                    className={`rounded-lg object-cover shadow-sm ${isStudio ? 'pointer-events-none' : ''}`}
                    style={{ width: interpolatedProps.width, height: interpolatedProps.height, ...interpolatedProps.style }}
                />
            );

        case 'Container':
            return (
                <div
                    className={`p-4 transition-all duration-300 min-h-[50px] rounded-lg ${isStudio ? 'border border-dashed border-slate-300 bg-slate-50/50' : 'border border-transparent'}`}
                    style={{
                        display: 'flex',
                        flexDirection: (interpolatedProps.direction as any) || 'column',
                        gap: interpolatedProps.gap || '1rem',
                        alignItems: interpolatedProps.alignItems || 'stretch',
                        justifyContent: interpolatedProps.justifyContent || 'flex-start',
                        padding: interpolatedProps.padding,
                        ...interpolatedProps.style,
                    }}
                >
                    {renderChildren ? renderChildren(children || []) : null}
                    {!hasChildren && isStudio && (
                        <div className="text-slate-400 text-xs border border-dashed border-slate-300 bg-white/40 p-3 text-center select-none rounded-md">{emptyContainerText}</div>
                    )}
                </div>
            );

        case 'Card':
            return (
                <div
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200"
                    style={{ padding: interpolatedProps.padding || '1.5rem', ...interpolatedProps.style }}
                >
                    {renderChildren ? renderChildren(children || []) : null}
                    {!hasChildren && isStudio && (
                        <div className="text-slate-400 text-[10px] border border-dashed border-slate-200 p-4 rounded text-center select-none bg-slate-50">{emptyCardText}</div>
                    )}
                </div>
            );

        case 'Divider':
            return (
                <div className="w-full" style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0', ...interpolatedProps.style }} />
            );

        case 'Checkbox': {
            const checked = component.bindState ? !!stateData[component.bindState] : !!interpolatedProps.checked;
            return (
                <label className={`flex items-center gap-3 select-none ${isStudio ? 'pointer-events-none opacity-90' : 'cursor-pointer'}`}>
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-primary-600 checked:border-primary-600 transition-all focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0"
                            checked={checked}
                            onChange={() => { if (!isStudio && component.bindState) onEvent?.(component.onEvent?.change); }}
                            disabled={isStudio}
                        />
                        <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{interpolatedProps.label}</span>
                </label>
            );
        }

        case 'Switch': {
            const isActive = component.bindState ? !!stateData[component.bindState] : !!interpolatedProps.active;
            return (
                <div className={`flex items-center justify-between gap-4 select-none ${isStudio ? 'pointer-events-none opacity-90' : 'cursor-pointer'}`}>
                    <span className="text-sm text-slate-700 font-medium">{interpolatedProps.label}</span>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${isActive ? 'bg-primary-600' : 'bg-slate-200'}`}
                        onClick={() => { if (!isStudio && component.bindState) onEvent?.(component.onEvent?.change); }}
                    >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                </div>
            );
        }

        case 'CustomComponent':
            return (
                <div
                    className="border-2 border-dashed border-primary-300 bg-primary-50/30 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-xl relative overflow-hidden"
                    style={{ ...interpolatedProps.style, padding: interpolatedProps.padding }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-indigo-500/5 pointer-events-none" />
                    <div className="text-primary-500 flex items-center gap-2 font-semibold text-xs bg-white px-3 py-1.5 rounded-full shadow-sm border border-primary-100 z-10">
                        <span>✨</span> {interpolatedProps.title || 'AI Custom Component'}
                    </div>
                    {interpolatedProps.description && (
                        <p className="text-[10px] text-slate-500 text-center max-w-[80%] z-10">{interpolatedProps.description}</p>
                    )}
                    {renderChildren ? renderChildren(children || []) : null}
                </div>
            );

        default:
            return <div className="p-4 border border-dashed border-red-300 rounded-lg bg-red-50 text-red-500 text-xs font-mono">Unknown: {component.type}</div>;
    }
};
