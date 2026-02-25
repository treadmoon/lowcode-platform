"use client";

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    Type,
    Square,
    RectangleHorizontal,
    TextCursorInput,
    Layout,
    Image as ImageIcon,
    CreditCard,
    Minus,
    CheckSquare,
    ToggleLeft,
    Sparkles,
    Trash2
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { ComponentSchema } from '../schema/types';

const ICON_MAP = {
    Text: Type,
    Button: RectangleHorizontal,
    Input: TextCursorInput,
    Container: Layout,
    Image: ImageIcon,
    Card: CreditCard,
    Divider: Minus,
    Checkbox: CheckSquare,
    Switch: ToggleLeft,
    CustomComponent: Sparkles
};

export const COMPONENT_TYPES = [
    { type: 'Text', label: 'Text', icon: 'Text' },
    { type: 'Button', label: 'Button', icon: 'Button' },
    { type: 'Input', label: 'Input', icon: 'Input' },
    { type: 'Container', label: 'Box', icon: 'Container' },
    { type: 'Image', label: 'Image', icon: 'Image' },
    { type: 'Card', label: 'Card', icon: 'Card' },
    { type: 'Divider', label: 'Divider', icon: 'Divider' },
    { type: 'Checkbox', label: 'Check', icon: 'Checkbox' },
    { type: 'Switch', label: 'Switch', icon: 'Switch' },
    { type: 'CustomComponent', label: 'AI Component', icon: 'CustomComponent' },
];

export const DraggableComponentItem = ({ type, label, iconName }: { type: string, label: string, iconName: string }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: {
            type: 'new-component',
            componentType: type
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const Icon = (ICON_MAP as any)[iconName] || Square;

    // Map component types to Deep Ocean Theme colors
    // Map component types to Deep Ocean Theme colors
    const getItemColor = (type: string) => {
        switch (type) {
            case 'Container': return {
                container: 'bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400',
                text: 'text-slate-600 group-hover:text-blue-600',
                icon: 'text-blue-500 bg-blue-50 group-hover:bg-white'
            };
            case 'Card': return {
                container: 'bg-white border border-slate-200 hover:bg-cyan-50 hover:border-cyan-400',
                text: 'text-slate-600 group-hover:text-cyan-600',
                icon: 'text-cyan-500 bg-cyan-50 group-hover:bg-white'
            };
            case 'Button': return {
                container: 'bg-white border border-slate-200 hover:bg-violet-50 hover:border-violet-400',
                text: 'text-slate-600 group-hover:text-violet-600',
                icon: 'text-violet-500 bg-violet-50 group-hover:bg-white'
            };
            case 'Input': return {
                container: 'bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-400',
                text: 'text-slate-600 group-hover:text-indigo-600',
                icon: 'text-indigo-500 bg-indigo-50 group-hover:bg-white'
            };
            case 'Text': return {
                container: 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-400',
                text: 'text-slate-600 group-hover:text-slate-700',
                icon: 'text-slate-500 bg-slate-50 group-hover:bg-white'
            };
            case 'Image': return {
                container: 'bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-400',
                text: 'text-slate-600 group-hover:text-teal-600',
                icon: 'text-teal-500 bg-teal-50 group-hover:bg-white'
            };
            case 'Checkbox':
            case 'Switch': return {
                container: 'bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-400',
                text: 'text-slate-600 group-hover:text-emerald-600',
                icon: 'text-emerald-500 bg-emerald-50 group-hover:bg-white'
            };
            default: return {
                container: 'bg-white border border-slate-200 hover:bg-primary-50 hover:border-primary-400',
                text: 'text-slate-600 group-hover:text-primary-600',
                icon: 'text-primary-500 bg-primary-50 group-hover:bg-white'
            };
        }
    };

    const colors = getItemColor(type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                group flex flex-col items-center justify-center gap-2 aspect-square rounded-xl
                shadow-sm transition-all duration-200
                ${colors.container}
                cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 hover:scale-105'}
            `}
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${colors.icon}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <span className={`text-[11px] font-semibold transition-colors ${colors.text}`}>
                {label}
            </span>
        </div>
    );
};

export const DraggableLibraryItem = ({ schemaItem, onDelete }: { schemaItem: { id: string, name: string, schema: ComponentSchema }, onDelete?: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `palette-lib-${schemaItem.id}`,
        data: {
            type: 'lib-component',
            schema: schemaItem.schema
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                group flex flex-col items-center justify-center gap-2 aspect-square rounded-xl
                shadow-sm transition-all duration-200
                bg-white border border-slate-200 hover:bg-fuchsia-50 hover:border-fuchsia-400
                cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 hover:scale-105'}
            `}
            title={schemaItem.name}
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-fuchsia-500 bg-fuchsia-50 group-hover:bg-white`}>
                <Sparkles size={20} strokeWidth={2} />
            </div>
            <span className={`text-[11px] font-semibold transition-colors text-slate-600 group-hover:text-fuchsia-600 line-clamp-1 px-2 text-center break-all`}>
                {schemaItem.name}
            </span>
            {onDelete && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(schemaItem.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10 cursor-pointer"
                >
                    <Trash2 size={10} />
                </div>
            )}
        </div>
    );
};

export const ComponentPalette = ({ customLibrary = [], onDeleteCustomComponent }: { customLibrary?: { id: string, name: string, schema: ComponentSchema }[], onDeleteCustomComponent?: (id: string) => void }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-4 p-2">
            <div className="grid grid-cols-2 gap-3">
                {COMPONENT_TYPES.map(c => (
                    <DraggableComponentItem
                        key={c.type}
                        type={c.type}
                        label={t(`components.${c.type}`)}
                        iconName={c.icon}
                    />
                ))}
            </div>

            {customLibrary.length > 0 && (
                <>
                    <div className="mt-4 mb-2 flex flex-col gap-1">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={14} className="text-fuchsia-500" />
                            AI 自定义库
                        </div>
                        <div className="h-[1px] bg-slate-200 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {customLibrary.map(item => (
                            <DraggableLibraryItem key={item.id} schemaItem={item} onDelete={onDeleteCustomComponent} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
