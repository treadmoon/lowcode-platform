"use client";

import React from 'react';
import { PageSchema, ComponentSchema, ActionFlow } from '../schema/types';
import { useStore } from '../state-core/store';
import { runActionFlow, RuntimeContext } from '../action-engine/engine';
import { useRouter } from 'next/navigation';
import { interpolateProps } from '../lib/interpolation';

export const PageRenderer = ({
    schema,
    onSelect,
    selectedId
}: {
    schema: PageSchema,
    onSelect?: (id: string) => void,
    selectedId?: string
}) => {
    const { state, dispatch } = useStore();
    const router = useRouter();

    const runtimeContext: RuntimeContext = {
        dispatch,
        state: state.data,
        navigate: (path) => router.push(path)
    };

    const handleEvent = (flowId?: string) => {
        if (!flowId) return;
        const flow = schema.actions.find(f => f.id === flowId);
        if (flow) {
            runActionFlow(flow, runtimeContext);
        } else {
            console.warn(`Flow not found: ${flowId}`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full">
            {schema.components.map(comp => (
                <DynamicComponent
                    key={comp.id}
                    component={comp}
                    stateData={state.data}
                    onEvent={handleEvent}
                    onSelect={onSelect}
                    selectedId={selectedId}
                />
            ))}
        </div>
    );
};

const DynamicComponent = ({
    component,
    stateData,
    onEvent,
    onSelect,
    selectedId
}: {
    component: ComponentSchema,
    stateData: Record<string, any>,
    onEvent: (flowId?: string) => void,
    onSelect?: (id: string) => void,
    selectedId?: string
}) => {
    // Interpolate Props
    const interpolatedProps = React.useMemo(() => {
        return interpolateProps(component.props, stateData);
    }, [component.props, stateData]);

    const isSelected = selectedId === component.id;

    const handleClick = (e: React.MouseEvent) => {
        if (onSelect) {
            e.stopPropagation(); // Prevent bubbling to container
            onSelect(component.id);
        }
    };

    // Wrapper class for selection highlight
    const wrapperClass = `
    transition-all duration-200 relative
    ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50 rounded-lg' : ''}
    ${onSelect ? 'cursor-pointer hover:ring-1 hover:ring-primary-300' : ''}
  `;

    const renderContent = () => {
        switch (component.type) {
            case 'Text':
                return (
                    <div style={interpolatedProps.style} className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {interpolatedProps.content}
                    </div>
                );

            case 'Button':
                return (
                    <button
                        className="
                relative overflow-hidden group
                bg-blue-600 hover:bg-blue-700
                text-white font-medium py-2 px-6 rounded-lg
                shadow-sm transition-all duration-200
                active:scale-95 border-none
              "
                        onClick={(e) => {
                            if (onSelect) {
                                handleClick(e);
                            } else {
                                onEvent(component.onEvent?.click);
                            }
                        }}
                    >
                        <span>{interpolatedProps.text}</span>
                    </button>
                );

            case 'Input':
                return (
                    <input
                        className="
                  w-full bg-white border border-slate-300
                  text-slate-900 text-sm rounded-lg
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  block w-full p-2.5 transition-all outline-none placeholder:text-slate-400
                "
                        value={component.bindState ? stateData[component.bindState] : ''}
                        {...interpolatedProps}
                        readOnly={!!onSelect}
                    />
                );

            case 'Image':
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={interpolatedProps.src || "https://placehold.co/100x100"}
                        alt={interpolatedProps.alt || "Image"}
                        className="rounded-lg object-cover shadow-sm"
                        style={{
                            width: interpolatedProps.width,
                            height: interpolatedProps.height,
                            ...interpolatedProps.style
                        }}
                    />
                );

            case 'Container':
                return (
                    <div
                        className="p-4 transition-all duration-300 min-h-[50px] border border-transparent"
                        style={{
                            display: 'flex',
                            flexDirection: (interpolatedProps.direction as any) || 'column',
                            gap: interpolatedProps.gap || '1rem',
                            alignItems: interpolatedProps.alignItems || 'stretch',
                            justifyContent: interpolatedProps.justifyContent || 'flex-start',
                            padding: interpolatedProps.padding,
                            ...interpolatedProps.style
                        }}
                    >
                        {component.children?.map(child => (
                            <DynamicComponent
                                key={child.id}
                                component={child}
                                stateData={stateData}
                                onEvent={onEvent}
                                onSelect={onSelect}
                                selectedId={selectedId}
                            />
                        ))}
                    </div>
                );

            case 'Card':
                return (
                    <div
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                        style={{
                            padding: interpolatedProps.padding || '1.5rem',
                            ...interpolatedProps.style
                        }}
                    >
                        {component.children?.map(child => (
                            <DynamicComponent
                                key={child.id}
                                component={child}
                                stateData={stateData}
                                onEvent={onEvent}
                                onSelect={onSelect}
                                selectedId={selectedId}
                            />
                        ))}
                    </div>
                );

            case 'Divider':
                return (
                    <div
                        className="w-full"
                        style={{
                            height: '1px',
                            backgroundColor: '#e2e8f0', // slate-200
                            margin: '1.5rem 0',
                            ...interpolatedProps.style
                        }}
                    />
                );

            case 'Checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-primary-600 checked:border-primary-600 transition-all focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0"
                                checked={component.bindState ? !!stateData[component.bindState] : !!interpolatedProps.checked}
                                onChange={() => {
                                    if (!onSelect && component.bindState) {
                                        onEvent(component.onEvent?.change);
                                    }
                                }}
                                disabled={!!onSelect}
                            />
                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{interpolatedProps.label}</span>
                    </label>
                );

            case 'Switch':
                const isActive = component.bindState ? !!stateData[component.bindState] : !!interpolatedProps.active;
                return (
                    <div className="flex items-center justify-between gap-4 cursor-pointer group select-none">
                        <span className="text-sm text-slate-700 font-medium">{interpolatedProps.label}</span>
                        <div className="relative inline-flex items-center pointer-events-auto">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={() => {
                                    if (!onSelect && component.bindState) {
                                        onEvent(component.onEvent?.change);
                                    }
                                }}
                                disabled={!!onSelect}
                            />
                            <div
                                className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 transition-colors"
                                onClick={() => {
                                    if (!onSelect && component.bindState) {
                                        onEvent(component.onEvent?.change);
                                    }
                                }}
                            ></div>
                        </div>
                    </div>
                );

            default:
                return <div className="p-4 border border-dashed border-red-300 rounded-lg bg-red-50 text-red-500 text-xs font-mono">Unknown Component: {component.type}</div>;
        }
    };

    return (
        <div className={wrapperClass} onClick={handleClick}>
            {renderContent()}
        </div>
    );
};
