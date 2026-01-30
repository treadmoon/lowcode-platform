"use client";

import React from 'react';
import { PageSchema, ComponentSchema, ActionFlow } from '../schema/types';
import { useStore } from '../state-core/store';
import { runActionFlow, RuntimeContext } from '../action-engine/engine';
import { useRouter } from 'next/navigation';

export const PageRenderer = ({ schema }: { schema: PageSchema }) => {
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {schema.components.map(comp => (
                <DynamicComponent
                    key={comp.id}
                    component={comp}
                    stateData={state.data}
                    onEvent={handleEvent}
                />
            ))}
        </div>
    );
};

const DynamicComponent = ({
    component,
    stateData,
    onEvent
}: {
    component: ComponentSchema,
    stateData: Record<string, any>,
    onEvent: (flowId?: string) => void
}) => {
    // Interpolate Props
    const interpolatedProps = React.useMemo(() => {
        const newProps = { ...component.props };
        Object.keys(newProps).forEach(key => {
            const val = newProps[key];
            if (typeof val === 'string' && val.includes('${')) {
                newProps[key] = val.replace(/\$\{([^}]+)\}/g, (_, path) => {
                    return stateData[path] !== undefined ? stateData[path] : '';
                });
            }
        });
        return newProps;
    }, [component.props, stateData]);

    switch (component.type) {
        case 'Text':
            return (
                <div style={interpolatedProps.style} className="text-gray-800 leading-relaxed transition-all duration-300">
                    {interpolatedProps.content}
                </div>
            );

        case 'Button':
            return (
                <button
                    className="
            relative overflow-hidden group
            bg-gradient-to-br from-indigo-500 to-purple-600 
            text-white font-medium py-2.5 px-6 rounded-lg 
            shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] 
            hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)] 
            hover:-translate-y-0.5 transition-all duration-200
            active:scale-95
          "
                    onClick={() => onEvent(component.onEvent?.click)}
                >
                    <span className="relative z-10">{interpolatedProps.text}</span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </button>
            );

        case 'Input':
            return (
                <input
                    className="
             w-full bg-gray-50 border border-gray-200 
             text-gray-900 text-sm rounded-lg 
             focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
             block w-full p-2.5 transition-all outline-none
           "
                    value={component.bindState ? stateData[component.bindState] : ''}
                    {...interpolatedProps}
                />
            );

        default:
            return <div className="p-4 border border-dashed border-red-300 rounded bg-red-50 text-red-500 text-xs">Unknown Component: {component.type}</div>;
    }
};
