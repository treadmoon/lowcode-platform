"use client";

import React from 'react';
import { PageSchema, ComponentSchema } from '../schema/types';
import { useStore } from '../state-core/store';
import { runActionFlow, RuntimeContext } from '../action-engine/engine';
import { useRouter } from 'next/navigation';
import { BaseComponentContent } from './BaseComponentContent';
import { runSandboxedJs } from '../lib/sandbox';

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
        if (flow) runActionFlow(flow, runtimeContext);
    };

    const renderComponent = (comp: ComponentSchema) => (
        <RuntimeComponent
            key={comp.id}
            component={comp}
            stateData={state.data}
            onEvent={handleEvent}
            runtimeContext={runtimeContext}
        />
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full">
            {schema.components.map(renderComponent)}
        </div>
    );
};

const RuntimeComponent = ({
    component,
    stateData,
    onEvent,
    runtimeContext
}: {
    component: ComponentSchema,
    stateData: Record<string, any>,
    onEvent: (flowId?: string) => void,
    runtimeContext: RuntimeContext
}) => {
    const handleClick = (e: React.MouseEvent) => {
        if (component.props.customJs) {
            try {
                runSandboxedJs(component.props.customJs, stateData, runtimeContext.dispatch, runtimeContext.navigate);
            } catch (err) {
                console.error("Custom JS Error:", err);
            }
        } else if (component.onEvent?.click) {
            onEvent(component.onEvent.click);
        }
    };

    return (
        <div onClick={handleClick} data-comp-id={component.id} className="transition-all duration-200 relative">
            {component.props.customCss && (
                <style dangerouslySetInnerHTML={{ __html: component.props.customCss.replace(/\.?selector/g, `[data-comp-id="${component.id}"]`) }} />
            )}
            <BaseComponentContent
                component={component}
                stateData={stateData}
                mode="runtime"
                onEvent={onEvent}
                renderChildren={(children) => children.map(child => (
                    <RuntimeComponent
                        key={child.id}
                        component={child}
                        stateData={stateData}
                        onEvent={onEvent}
                        runtimeContext={runtimeContext}
                    />
                ))}
            />
        </div>
    );
};
