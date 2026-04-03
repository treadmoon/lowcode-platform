"use client";

import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageSchema, ComponentSchema } from '../schema/types';
import { useStore } from '../state-core/store';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from '../i18n';
import { BaseComponentContent } from '../renderer/BaseComponentContent';

const StudioComponent = ({
  component,
  stateData,
  onSelect,
  onDelete,
  onUpdate,
  selectedId,
  dragOverId
}: {
  component: ComponentSchema,
  stateData: any,
  onSelect?: (id: string) => void,
  onDelete?: (id: string) => void,
  onUpdate?: (updates: Partial<ComponentSchema['props']>) => void,
  selectedId?: string,
  dragOverId?: string
}) => {
  const { t } = useTranslation();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({
    id: component.id,
    disabled: isResizing,
    data: { type: 'existing-component', component }
  });

  const isSelected = selectedId === component.id;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging || isResizing ? 999 : undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(component.id);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, w: rect.width, h: rect.height });
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      onUpdate?.({
        style: {
          ...component.props.style,
          width: `${Math.max(20, resizeStart.w + e.clientX - resizeStart.x)}px`,
          height: `${Math.max(20, resizeStart.h + e.clientY - resizeStart.y)}px`
        }
      });
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, onUpdate, component.props.style]);

  const isDragOver = dragOverId === component.id;

  const wrapperClass = `
    relative transition-all duration-200 group inline-block
    ${isSelected ? 'ring-2 ring-primary-500 z-20' : ''}
    ${isDragOver ? 'ring-2 ring-dashed ring-emerald-400 bg-emerald-50/30 z-10' : ''}
    ${!isDragging && !isSelected && !isDragOver ? 'hover:ring-1 hover:ring-primary-300' : ''}
    ${component.type === 'Container' || component.type === 'Card' ? 'block w-full min-h-[50px] rounded-lg' : 'w-fit rounded-lg'}
  `;

  const renderChildrenWithSortable = (children: ComponentSchema[]) => (
    <SortableContext
      id={component.id}
      items={children.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      {children.map(child => (
        <StudioComponent
          key={child.id}
          component={child}
          stateData={stateData}
          onSelect={onSelect}
          onDelete={onDelete}
          onUpdate={onUpdate}
          selectedId={selectedId}
          dragOverId={dragOverId}
        />
      ))}
    </SortableContext>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-comp-id={component.id}
      onClick={handleClick}
      className={wrapperClass}
    >
      {component.props.customCss && (
        <style dangerouslySetInnerHTML={{ __html: component.props.customCss.replace(/\.?selector/g, `[data-comp-id="${component.id}"]`) }} />
      )}
      <BaseComponentContent
        component={component}
        stateData={stateData}
        mode="studio"
        renderChildren={renderChildrenWithSortable}
        emptyContainerText={t('ui.emptyContainer')}
        emptyCardText={t('ui.emptyCard')}
      />
      {isSelected && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(component.id); }}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white text-slate-500 border border-slate-200 rounded-full flex items-center justify-center text-[10px] shadow-md hover:scale-110 hover:text-red-500 hover:border-red-200 transition-all z-50 pointer-events-auto"
            title={t('inspector.msg_delete')}
          >
            ✕
          </button>
          <div onMouseDown={handleResizeStart} className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-primary-500 rounded-full cursor-nwse-resize z-50 shadow-sm hover:scale-125 transition-transform" />
          <div className="absolute -bottom-1 right-1/2 translate-x-1/2 w-6 h-1 bg-primary-400/50 rounded-full cursor-ns-resize z-40 hover:bg-primary-500" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-400/50 rounded-full cursor-ew-resize z-40 hover:bg-primary-500" />
        </>
      )}
    </div>
  );
};

export const StudioRenderer = ({
  schema, onSelect, onDelete, onUpdate, selectedId, dragOverId
}: {
  schema: PageSchema,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onUpdate?: (updates: Partial<ComponentSchema['props']>) => void,
  selectedId?: string,
  dragOverId?: string
}) => {
  const { state } = useStore();
  return (
    <div className="h-full">
      <SortableContext id="root-canvas" items={schema.components.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4 min-h-[100px] p-4 items-start">
          {schema.components.map(comp => (
            <StudioComponent
              key={comp.id}
              component={comp}
              stateData={state.data}
              onSelect={onSelect}
              onDelete={onDelete}
              onUpdate={onUpdate}
              selectedId={selectedId}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
