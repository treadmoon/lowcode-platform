"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageSchema, ComponentSchema } from '../schema/types';
import { useStore } from '../state-core/store';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { interpolateProps } from '../lib/interpolation';
import { useTranslation } from '../i18n';

const StudioComponent = ({
  component,
  stateData,
  onSelect,
  onDelete,
  onUpdate,
  selectedId
}: {
  component: ComponentSchema,
  stateData: any,
  onSelect?: (id: string) => void,
  onDelete?: (id: string) => void,
  onUpdate?: (updates: Partial<ComponentSchema['props']>) => void,
  selectedId?: string
}) => {
  const { t } = useTranslation();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: component.id,
    disabled: isResizing,
    data: {
      type: 'existing-component',
      component
    }
  });

  const interpolatedProps = React.useMemo(() => {
    return interpolateProps(component.props, stateData);
  }, [component.props, stateData]);

  const isSelected = selectedId === component.id;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging || isResizing ? 999 : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(component.id);
  };

  // Resize Logic
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const newWidth = Math.max(20, resizeStart.w + deltaX);
      const newHeight = Math.max(20, resizeStart.h + deltaY);

      onUpdate?.({
        style: {
          ...component.props.style,
          width: `${newWidth}px`,
          height: `${newHeight}px`
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, onUpdate, component.props.style]);

  const wrapperClass = `
    relative transition-all duration-200 group inline-block
    ${isSelected ? 'ring-2 ring-primary-500 z-20' : ''}
    ${!isDragging && !isSelected ? 'hover:ring-1 hover:ring-primary-300' : ''}
    ${component.type === 'Container' || component.type === 'Card' ? 'block w-full min-h-[50px] rounded-lg' : 'w-fit rounded-lg'}
  `;

  const renderInner = () => {
    switch (component.type) {
      case 'Text':
        return <div style={interpolatedProps.style} className="text-slate-700 p-2 whitespace-pre-wrap">{interpolatedProps.content}</div>;
      case 'Button':
        return <button style={interpolatedProps.style} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm pointer-events-none transition-all text-sm">{interpolatedProps.text}</button>;
      case 'Input':
        return <input style={interpolatedProps.style} className="border border-slate-300 p-2 rounded-md w-full bg-white text-slate-900 pointer-events-none placeholder:text-slate-400 text-sm hover:border-primary-400 transition-colors shadow-sm" placeholder={interpolatedProps.placeholder} readOnly />;
      case 'Image':
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={interpolatedProps.src} alt="img" className="w-full h-full object-cover rounded-lg pointer-events-none shadow-sm" style={{ width: interpolatedProps.width, height: interpolatedProps.height }} />;
      case 'Container':
        return (
          <div
            className="border border-dashed border-slate-300 bg-slate-50/50 p-4 flex flex-col gap-2 min-h-[80px] rounded-lg"
            style={{
              ...interpolatedProps.style,
              padding: interpolatedProps.padding
            }}
          >
            <SortableContext
              id={component.id}
              items={component.children?.map(c => c.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {component.children?.map(child => (
                <StudioComponent
                  key={child.id}
                  component={child}
                  stateData={stateData}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  selectedId={selectedId}
                />
              ))}
            </SortableContext>
            {(!component.children || component.children.length === 0) && (
              <div className="text-slate-400 text-xs border border-dashed border-slate-300 bg-white/40 p-3 text-center select-none rounded-md">{t('ui.emptyContainer')}</div>
            )}
          </div>
        );
      case 'Card':
        return (
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all duration-200"
            style={{
              ...interpolatedProps.style,
              padding: interpolatedProps.padding
            }}
          >
            <SortableContext
              id={component.id}
              items={component.children?.map(c => c.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {component.children?.map(child => (
                <StudioComponent
                  key={child.id}
                  component={child}
                  stateData={stateData}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  selectedId={selectedId}
                />
              ))}
            </SortableContext>
            {(!component.children || component.children.length === 0) && (
              <div className="text-slate-400 text-[10px] border border-dashed border-slate-200 p-4 rounded text-center select-none bg-slate-50">{t('ui.emptyCard')}</div>
            )}
          </div>
        );
      case 'Divider':
        return <div className="w-full bg-slate-200 my-4" style={{ height: '1px', ...interpolatedProps.style }} />;
      case 'Checkbox':
        return (
          <div className="flex items-center gap-2 pointer-events-none opacity-90" style={interpolatedProps.style}>
            <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${interpolatedProps.checked ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-300'}`}>
              {interpolatedProps.checked && <span className="text-[10px] font-bold">✓</span>}
            </div>
            <span className="text-xs text-slate-700 font-medium tracking-tight">{interpolatedProps.label}</span>
          </div>
        );
      case 'Switch':
        return (
          <div className="flex items-center justify-between gap-4 pointer-events-none opacity-90" style={interpolatedProps.style}>
            <span className="text-xs text-slate-700 font-medium tracking-tight">{interpolatedProps.label}</span>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${interpolatedProps.active ? 'bg-primary-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${interpolatedProps.active ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>
        );
      case 'CustomComponent':
        return (
          <div
            className="border-2 border-dashed border-primary-300 bg-primary-50/30 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-xl relative overflow-hidden group"
            style={{ ...interpolatedProps.style, padding: interpolatedProps.padding }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-indigo-500/5 pointer-events-none" />
            <div className="text-primary-500 flex items-center gap-2 font-semibold text-xs bg-white px-3 py-1.5 rounded-full shadow-sm border border-primary-100 z-10 transition-transform group-hover:scale-105">
              <span>✨</span> {interpolatedProps.title || 'AI Custom Component'}
            </div>
            {interpolatedProps.description && (
              <p className="text-[10px] text-slate-500 text-center max-w-[80%] z-10">{interpolatedProps.description}</p>
            )}
            <SortableContext
              id={component.id}
              items={component.children?.map(c => c.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {component.children?.map(child => (
                <StudioComponent
                  key={child.id}
                  component={child}
                  stateData={stateData}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  selectedId={selectedId}
                />
              ))}
            </SortableContext>
          </div>
        );
      default: return <div>Unknown</div>;
    }
  };

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
      {renderInner()}

      {isSelected && (
        <>
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(component.id);
            }}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white text-slate-500 border border-slate-200 rounded-full flex items-center justify-center text-[10px] shadow-md hover:scale-110 hover:text-red-500 hover:border-red-200 transition-all z-50 pointer-events-auto"
            title={t('inspector.msg_delete')}
          >
            ✕
          </button>

          {/* Resize Handles */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-primary-500 rounded-full cursor-nwse-resize z-50 shadow-sm hover:scale-125 transition-transform"
          />
          <div
            className="absolute -bottom-1 right-1/2 translate-x-1/2 w-6 h-1 bg-primary-400/50 rounded-full cursor-ns-resize z-40 hover:bg-primary-500"
          />
          <div
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-400/50 rounded-full cursor-ew-resize z-40 hover:bg-primary-500"
          />
        </>
      )}
    </div>
  );
};

export const StudioRenderer = ({
  schema,
  onSelect,
  onDelete,
  onUpdate,
  selectedId
}: {
  schema: PageSchema,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onUpdate?: (updates: Partial<ComponentSchema['props']>) => void,
  selectedId?: string
}) => {
  const { state } = useStore();

  return (
    <div className="h-full">
      <SortableContext
        id="root-canvas"
        items={schema.components.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
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
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
