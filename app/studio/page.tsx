"use client";

import { useEffect, useState, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelLeft,
    PanelRight,
    Code,
    Package,
    Search,
    ChevronRight,
    MousePointer2,
    Database,
    Layers
} from 'lucide-react';
import { AppSchema, ComponentSchema, PageSchema } from '../../packages/schema/types';
import { MockDB } from '../../packages/mock-db';
import { StoreProvider } from '../../packages/state-core/store';
import { LanguageProvider, useTranslation } from '../../packages/i18n';

// Studio Core
import { ComponentPalette } from '../../packages/studio-core/ComponentPalette';
import { StudioCanvas } from '../../packages/studio-core/StudioCanvas';
import { PropertyInspector } from '../../packages/studio-core/PropertyInspector';
import { StudioRenderer } from '../../packages/studio-core/StudioRenderer';
import { StudioHeader } from '../../packages/studio-core/StudioHeader';
import { AICopilotPanel } from '../../packages/studio-core/AICopilotPanel';
import { StudioDataPanel } from '../../packages/studio-core/StudioDataPanel';
import { PageInspector } from '../../packages/studio-core/PageInspector';
import { SchemaOutline } from '../../packages/studio-core/SchemaOutline';

// Helper to find container of an item
const findContainer = (id: string, components: ComponentSchema[]): string | undefined => {
    if (components.find(c => c.id === id)) return 'root-canvas';
    for (const comp of components) {
        if (comp.children) {
            if (comp.children.find(c => c.id === id)) return comp.id;
            const found = findContainer(id, comp.children);
            if (found) return found;
        }
    }
    return undefined;
};

const findComponentById = (components: ComponentSchema[], id: string): ComponentSchema | null => {
    for (const comp of components) {
        if (comp.id === id) return comp;
        if (comp.children) {
            const found = findComponentById(comp.children, id);
            if (found) return found;
        }
    }
    return null;
};

const updateComponentProps = (components: ComponentSchema[], id: string, newProps: any): ComponentSchema[] => {
    return components.map(comp => {
        if (comp.id === id) {
            return { ...comp, props: { ...comp.props, ...newProps } };
        }
        if (comp.children) {
            return { ...comp, children: updateComponentProps(comp.children, id, newProps) };
        }
        return comp;
    });
};

const insertItem = (components: ComponentSchema[], containerId: string, item: ComponentSchema, index: number): ComponentSchema[] => {
    if (containerId === 'root-canvas') {
        const newComps = [...components];
        newComps.splice(index, 0, item);
        return newComps;
    }
    return components.map(comp => {
        if (comp.id === containerId) {
            const newChildren = [...(comp.children || [])];
            newChildren.splice(index, 0, item);
            return { ...comp, children: newChildren };
        }
        if (comp.children) {
            return { ...comp, children: insertItem(comp.children, containerId, item, index) };
        }
        return comp;
    });
};

const removeItem = (components: ComponentSchema[], id: string): ComponentSchema[] => {
    return components.filter(c => c.id !== id).map(c => ({
        ...c,
        children: c.children ? removeItem(c.children, id) : []
    }));
};

const moveItemInTree = (rootComponents: ComponentSchema[], activeId: string, overId: string) => {
    let newComponents = [...rootComponents];
    const sourceContainerId = findContainer(activeId, newComponents);
    const overContainerId = findContainer(overId, newComponents) || (overId === 'root-canvas' ? 'root-canvas' : undefined);

    if (!sourceContainerId || !overContainerId) return newComponents;

    const activeItem = findComponentById(newComponents, activeId);
    if (!activeItem) return newComponents;

    newComponents = removeItem(newComponents, activeId);

    const destContainer = overContainerId === 'root-canvas'
        ? { children: newComponents }
        : findComponentById(newComponents, overContainerId);

    if (!destContainer) return newComponents;

    const destItems = overContainerId === 'root-canvas' ? newComponents : (destContainer.children || []);
    let newIndex = destItems.length;
    if (overId !== overContainerId) {
        const overIndex = destItems.findIndex(x => x.id === overId);
        newIndex = overIndex >= 0 ? overIndex : destItems.length;
    }

    if (overContainerId === 'root-canvas') {
        newComponents.splice(newIndex, 0, activeItem);
    } else {
        const updateContainerChildren = (comps: ComponentSchema[]): ComponentSchema[] => {
            return comps.map(c => {
                if (c.id === overContainerId) {
                    const next = [...(c.children || [])];
                    next.splice(newIndex, 0, activeItem);
                    return { ...c, children: next };
                }
                if (c.children) return { ...c, children: updateContainerChildren(c.children) };
                return c;
            });
        };
        newComponents = updateContainerChildren(newComponents);
    }
    return newComponents;
};

const moveItemIntoContainer = (rootComponents: ComponentSchema[], activeId: string, targetContainerId: string) => {
    let newComponents = [...rootComponents];
    const activeItem = findComponentById(newComponents, activeId);
    if (!activeItem) return newComponents;

    // Prevent recursive dropping (dropping parent into child)
    let check = findComponentById([activeItem], targetContainerId);
    if (check) return newComponents;

    newComponents = removeItem(newComponents, activeId);

    const updateContainer = (comps: ComponentSchema[]): ComponentSchema[] => {
        return comps.map(c => {
            if (c.id === targetContainerId) {
                return { ...c, children: [...(c.children || []), activeItem] };
            }
            if (c.children) return { ...c, children: updateContainer(c.children) };
            return c;
        });
    };

    // Check if moving to root
    if (targetContainerId === 'root-canvas') {
        newComponents.push(activeItem);
        return newComponents;
    }

    return updateContainer(newComponents);
};

const deepCloneComponent = (comp: ComponentSchema): ComponentSchema => {
    return {
        ...comp,
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        children: comp.children ? comp.children.map(deepCloneComponent) : undefined
    };
};

function StudioContent() {
    const { t, language } = useTranslation();
    const [schema, setSchema] = useState<AppSchema | null>(null);
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [activeDraggable, setActiveDraggable] = useState<any>(null);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    // UI State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'components' | 'schema' | 'data' | 'outline'>('components');
    const [leftWidth, setLeftWidth] = useState(300);
    const [rightWidth, setRightWidth] = useState(320);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) {
                const newWidth = Math.max(200, Math.min(800, e.clientX));
                setLeftWidth(newWidth);
            }
            if (isResizingRight) {
                const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
                setRightWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingRight]);

    useEffect(() => {
        MockDB.getSchema().then(s => {
            setSchema(s);
            setJsonText(JSON.stringify(s, null, 2));
        });
    }, []);

    const updateSchema = (newSchema: AppSchema) => {
        setSchema(newSchema);
        setJsonText(JSON.stringify(newSchema, null, 2));
    };

    const handleDelete = (id: string) => {
        if (!schema) return;
        const newPages = [...schema.pages];
        newPages[0].components = removeItem(newPages[0].components, id);
        updateSchema({ ...schema, pages: newPages });
        setSelectedComponentId(null);
    };

    const handlePropUpdate = (newProps: any) => {
        if (!schema || !selectedComponentId) return;
        const newPages = [...schema.pages];
        newPages[0].components = updateComponentProps(newPages[0].components, selectedComponentId, newProps);
        updateSchema({ ...schema, pages: newPages });
    };

    const handleUpdatePage = (updates: Partial<PageSchema>) => {
        if (!schema) return;
        const newPages = [...schema.pages];
        newPages[0] = { ...newPages[0], ...updates };
        updateSchema({ ...schema, pages: newPages });
    };

    const handleAddCustomComponent = (component: ComponentSchema, name: string) => {
        if (!schema) return;
        const newLibrary = [...(schema.customLibrary || []), { id: `lib-${Date.now()}`, name, schema: component }];
        updateSchema({ ...schema, customLibrary: newLibrary });
    };

    const handleUpdateCustomComponent = (idOrName: string, newComponent: ComponentSchema) => {
        if (!schema || !schema.customLibrary) return;
        const index = schema.customLibrary.findIndex(c => c.id === idOrName || c.name === idOrName);
        if (index === -1) {
            // Not found, so we just add it instead
            handleAddCustomComponent(newComponent, idOrName);
            return;
        }
        const newLibrary = [...schema.customLibrary];
        newLibrary[index] = { ...newLibrary[index], schema: newComponent };
        updateSchema({ ...schema, customLibrary: newLibrary });
    };

    const handleDeleteCustomComponent = (id: string) => {
        if (!schema || !schema.customLibrary) return;
        const newLibrary = schema.customLibrary.filter(c => c.id !== id);
        updateSchema({ ...schema, customLibrary: newLibrary });
    };

    const handleClearElements = () => {
        if (!schema) return;
        handleUpdatePage({ components: [] });
        setSelectedComponentId(null);
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonText(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setSchema(parsed);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSave = async () => {
        if (schema) {
            setSaveStatus(t('studio.saving'));
            await MockDB.saveSchema(schema);
            setSaveStatus(t('studio.saved'));
            setTimeout(() => setSaveStatus(null), 2000);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'new-component') {
            setActiveDraggable({ type: 'new', ...active.data.current });
        } else {
            setActiveDraggable({ type: 'existing', ...active.data.current });
            setSelectedComponentId(active.id as string);
        }
    };

    const handleDragOver = () => { };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraggable(null);
        if (!over || !schema) return;

        if (active.data.current?.type === 'new-component' || active.data.current?.type === 'lib-component') {
            const isLib = active.data.current.type === 'lib-component';
            const type = isLib ? null : active.data.current.componentType;
            let containerId = 'root-canvas';
            let index = -1;
            const overComp = findComponentById(schema.pages[0].components, over.id as string);

            if (over.id === 'studio-canvas' || over.id === 'root-canvas') {
                containerId = 'root-canvas';
                index = schema.pages[0].components.length;
            } else if (overComp && overComp.type === 'Container') {
                containerId = overComp.id;
                index = (overComp.children?.length || 0);
            } else {
                const cont = findContainer(over.id as string, schema.pages[0].components);
                if (cont) containerId = cont;
            }

            const defaultComponent: ComponentSchema = {
                id: `comp-${Date.now()}`,
                type: type as any,
                props: {
                    ...(type === 'Text' && { content: 'New Text Block' }),
                    ...(type === 'Button' && { text: 'Click Me' }),
                    ...(type === 'Input' && { placeholder: 'Input...' }),
                    ...(type === 'Image' && { src: 'https://placehold.co/200', width: '200px' }),
                    ...(type === 'Container' && { padding: '1rem', style: { border: '1px dashed #ccc' } }),
                    ...(type === 'Card' && { padding: '1.5rem', style: { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e5e7eb' } }),
                    ...(type === 'Divider' && { style: { height: '1px', backgroundColor: '#e5e7eb', margin: '1rem 0' } }),
                    ...(type === 'Checkbox' && { label: 'Option Label', checked: false }),
                    ...(type === 'Switch' && { label: 'Toggle Switch', active: false }),
                    ...(type === 'CustomComponent' && { title: 'AI 组件', description: '这里将会由 AI 生成...', style: { width: '100%', minHeight: '150px' } }),
                },
                children: []
            };

            const newComponent = isLib ? deepCloneComponent(active.data.current.schema) : defaultComponent;

            const newComponents = insertItem(schema.pages[0].components, containerId, newComponent, index < 0 ? 999 : index);
            const newPages = [...schema.pages];
            newPages[0] = { ...newPages[0], components: newComponents };
            updateSchema({ ...schema, pages: newPages });
            setSelectedComponentId(newComponent.id);

        } else if (active.id !== over.id) {
            const overComp = findComponentById(schema.pages[0].components, over.id as string);

            // Nesting Logic: If dropping ON a Container/Card, move INSIDE
            if (overComp && (overComp.type === 'Container' || overComp.type === 'Card')) {
                const newComponents = moveItemIntoContainer(schema.pages[0].components, active.id as string, over.id as string);
                const newPages = [...schema.pages];
                newPages[0] = { ...newPages[0], components: newComponents };
                updateSchema({ ...schema, pages: newPages });
            } else {
                // Sorting Logic: Reorder relative to sibling
                const newComponents = moveItemInTree(schema.pages[0].components, active.id as string, over.id as string);
                const newPages = [...schema.pages];
                newPages[0] = { ...newPages[0], components: newComponents };
                updateSchema({ ...schema, pages: newPages });
            }
        }
    };

    if (!schema) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6">
            <div className="w-12 h-12 rounded-xl bg-primary-500 animate-pulse flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Code size={24} className="text-white" />
            </div>
            <div className="text-slate-500 text-sm font-medium tracking-widest uppercase animate-pulse">
                Initializing Workspace
            </div>
        </div>
    );

    const activePage = schema.pages[0];
    const selectedComponent = selectedComponentId ? findComponentById(activePage.components, selectedComponentId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-primary-100">
                <StudioHeader
                    pageTitle={activePage.path}
                    onSave={handleSave}
                />

                <main className="flex-1 flex overflow-hidden relative">
                    {/* Left Sidebar */}
                    <motion.aside
                        initial={false}
                        animate={{ width: leftPanelOpen ? leftWidth : 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="border-r border-slate-200 bg-white flex flex-col relative z-30 overflow-hidden shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
                        style={{ width: leftWidth }}
                    >
                        <div className="h-full flex flex-col" style={{ width: leftWidth }}>
                            <div className="flex flex-wrap border-b border-slate-100 p-2 gap-1.5 bg-slate-50/50">
                                <button
                                    onClick={() => setActiveTab('components')}
                                    className={`flex-1 min-w-[70px] px-2 py-1.5 text-[11px] rounded-md font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 ${activeTab === 'components' ? 'text-primary-600 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                                >
                                    <Package size={13} className="shrink-0" />
                                    <span className="truncate">{t('ui.components')}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('outline')}
                                    className={`flex-1 min-w-[70px] px-2 py-1.5 text-[11px] rounded-md font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 ${activeTab === 'outline' ? 'text-primary-600 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                                >
                                    <Layers size={13} className="shrink-0" />
                                    <span className="truncate">{t('ui.outline')}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('data')}
                                    className={`flex-1 min-w-[70px] px-2 py-1.5 text-[11px] rounded-md font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 ${activeTab === 'data' ? 'text-primary-600 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                                >
                                    <Database size={13} className="shrink-0" />
                                    <span className="truncate">{t('ui.data')}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('schema')}
                                    className={`flex-1 min-w-[70px] px-2 py-1.5 text-[11px] rounded-md font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 ${activeTab === 'schema' ? 'text-primary-600 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                                >
                                    <Code size={13} className="shrink-0" />
                                    <span className="truncate">{t('ui.schema')}</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'components' ? (
                                        <motion.div
                                            key="palette"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="p-3"
                                        >
                                            <div className="relative mb-4">
                                                <Search size={14} className="absolute left-3 top-[10px] text-slate-400" />
                                                <input
                                                    placeholder={t('ui.searchPlaceholder')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder:text-slate-400 py-2 pl-9 pr-4"
                                                />
                                            </div>
                                            <ComponentPalette
                                                customLibrary={schema.customLibrary || []}
                                                onDeleteCustomComponent={handleDeleteCustomComponent}
                                            />
                                        </motion.div>
                                    ) : activeTab === 'data' ? (
                                        <motion.div
                                            key="data-mock"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="h-full flex flex-col"
                                        >
                                            <StudioDataPanel schema={schema} onUpdateSchema={updateSchema} />
                                        </motion.div>
                                    ) : activeTab === 'outline' ? (
                                        <motion.div
                                            key="outline"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="h-full flex flex-col"
                                        >
                                            <SchemaOutline schema={schema} selectedId={selectedComponentId} onSelect={setSelectedComponentId} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="schema"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="h-full flex flex-col"
                                        >
                                            <textarea
                                                className="flex-1 w-full bg-slate-50 p-4 text-[11px] font-mono text-slate-600 leading-relaxed outline-none resize-none selection:bg-primary-100"
                                                value={jsonText}
                                                onChange={handleJsonChange}
                                                spellCheck={false}
                                            />
                                            {error && (
                                                <div className="p-3 bg-red-50 border-t border-red-100 text-red-600 text-[10px] font-mono mx-2 mb-2 rounded-lg">
                                                    Error: {error}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Resize Handle */}
                    {leftPanelOpen && (
                        <div
                            onMouseDown={() => setIsResizingLeft(true)}
                            className="w-[1px] hover:w-1 h-full bg-slate-200 hover:bg-primary-500 cursor-col-resize z-40 transition-all active:bg-primary-600"
                        />
                    )}

                    {/* Workspace Wrapper */}
                    <div className="flex-1 flex flex-col relative bg-slate-50/50">
                        {/* Dot Grid Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                        <div className="flex-1 overflow-auto scroll-smooth custom-scrollbar relative z-10 p-8 flex justify-center" style={{ backgroundColor: activePage?.props?.backgroundColor, padding: activePage?.props?.padding }}>
                            <StoreProvider key={JSON.stringify(schema.initialState)} initialState={schema.initialState}>
                                <StudioCanvas>
                                    <StudioRenderer
                                        schema={activePage}
                                        onSelect={(id) => setSelectedComponentId(id)}
                                        onUpdate={handlePropUpdate}
                                        onDelete={handleDelete}
                                        selectedId={selectedComponentId || undefined}
                                    />
                                </StudioCanvas>
                            </StoreProvider>
                        </div>

                        {/* Floating Interaction Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200/50 px-6 py-2.5 rounded-full shadow-lg shadow-slate-200/50 z-40 hover:scale-105 transition-transform duration-300">
                            <button
                                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${leftPanelOpen ? 'text-primary-600' : 'text-slate-400 hover:text-primary-600'}`}
                            >
                                <PanelLeft size={16} />
                                Palette
                            </button>
                            <div className="w-[1px] h-4 bg-slate-200" />
                            <div className="flex items-center gap-2 text-slate-900">
                                <MousePointer2 size={16} className="text-primary-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Select</span>
                            </div>
                            <div className="w-[1px] h-4 bg-slate-200" />
                            <button
                                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${rightPanelOpen ? 'text-primary-600' : 'text-slate-400 hover:text-primary-600'}`}
                            >
                                <PanelRight size={16} />
                                Inspector
                            </button>
                        </div>
                    </div>

                    {/* Resize Handle Right */}
                    {rightPanelOpen && (
                        <div
                            onMouseDown={() => setIsResizingRight(true)}
                            className="w-[1px] hover:w-1 h-full bg-slate-200 hover:bg-primary-500 cursor-col-resize z-40 transition-all active:bg-primary-600"
                        />
                    )}

                    {/* Right Sidebar - Inspector */}
                    <motion.aside
                        initial={false}
                        animate={{ width: rightPanelOpen ? rightWidth : 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="border-l border-slate-200 bg-white flex flex-col relative z-30 overflow-hidden shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]"
                        style={{ width: rightWidth }}
                    >
                        <div className="h-full flex flex-col" style={{ width: rightWidth }}>
                            {selectedComponent ? (
                                <PropertyInspector
                                    component={selectedComponent}
                                    onUpdate={handlePropUpdate}
                                    onDelete={handleDelete}
                                />
                            ) : activePage ? (
                                <PageInspector
                                    page={activePage}
                                    onUpdatePage={handleUpdatePage}
                                    onClearElements={handleClearElements}
                                />
                            ) : null}
                        </div>
                    </motion.aside>
                </main>

                <DragOverlay dropAnimation={null}>
                    {activeDraggable ? (
                        <div className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow-xl shadow-primary-600/30 border border-white/20 flex items-center gap-3 scale-105 backdrop-blur-sm cursor-grabbing">
                            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                                <Package size={14} className="text-white" />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest">
                                {activeDraggable.componentType || t('ui.moving')}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
                <AICopilotPanel
                    schema={schema}
                    onUpdatePage={(components) => handleUpdatePage({ components })}
                    onAddCustomComponent={handleAddCustomComponent}
                    onUpdateCustomComponent={handleUpdateCustomComponent}
                />
            </div>
        </DndContext>
    );
}

export default function StudioPage() {
    return (
        <LanguageProvider>
            <StudioContent />
        </LanguageProvider>
    );
}
