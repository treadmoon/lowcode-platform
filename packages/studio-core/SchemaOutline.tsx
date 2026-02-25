"use client";

import React from 'react';
import { AppSchema, ComponentSchema, PageSchema } from '../schema/types';
import {
    LayoutTemplate,
    ChevronDown,
    ChevronRight,
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
    Box
} from 'lucide-react';
import { useTranslation } from '../i18n';

const ICON_MAP: Record<string, any> = {
    Text: Type,
    Button: RectangleHorizontal,
    Input: TextCursorInput,
    Container: Layout,
    Image: ImageIcon,
    Card: CreditCard,
    Divider: Minus,
    Checkbox: CheckSquare,
    Switch: ToggleLeft,
    Page: LayoutTemplate
};

export const SchemaOutline = ({
    schema,
    selectedId,
    onSelect
}: {
    schema: AppSchema;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}) => {
    const { t } = useTranslation();

    const TreeNode = ({
        node,
        level = 0
    }: {
        node: ComponentSchema | { id: string, type: 'Page', children: ComponentSchema[] };
        level?: number;
    }) => {
        const [expanded, setExpanded] = React.useState(true);
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedId === node.id || (selectedId === null && node.type === 'Page');
        const Icon = ICON_MAP[node.type] || BlockIcon;

        const handleSelect = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (node.type === 'Page') {
                onSelect(null);
            } else {
                onSelect(node.id);
            }
        };

        return (
            <div className="flex flex-col">
                <div
                    className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors group ${isSelected ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-500' : 'hover:bg-slate-100 text-slate-700'}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={handleSelect}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center mr-1 text-slate-400 hover:bg-slate-200 rounded shrink-0"
                        onClick={(e) => {
                            if (hasChildren) {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }
                        }}
                    >
                        {hasChildren ? (
                            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <div className="w-1" />
                        )}
                    </div>

                    <Icon size={14} className={`mr-2 shrink-0 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate select-none flex-1">
                        {node.type === 'Page' ? t('ui.rootPage') : t(`components.${node.type}`)}
                    </span>
                    <span className="text-[9px] text-slate-400 ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity truncate w-16 text-right">
                        {node.id.split('-').pop()}
                    </span>
                </div>
                {expanded && hasChildren && (
                    <div className="flex flex-col">
                        {node.children!.map(child => (
                            <TreeNode key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const BlockIcon = Box;

    if (!schema || !schema.pages || !schema.pages[0]) return null;
    const page = schema.pages[0];

    const rootNode = {
        id: page.id || 'root',
        type: 'Page' as const,
        children: page.components
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in duration-300">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 p-3 shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('ui.outline') || 'Outline'}</span>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 pb-6 custom-scrollbar text-sm">
                <TreeNode node={rootNode} />
            </div>
        </div>
    );
};
