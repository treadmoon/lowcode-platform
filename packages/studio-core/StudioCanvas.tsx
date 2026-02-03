"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export const StudioCanvas = ({ children }: { children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'studio-canvas',
    });

    return (
        <div
            ref={setNodeRef}
            className={`
        w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border 
        h-[600px] flex flex-col relative transition-all
        ${isOver ? 'ring-4 ring-neon-indigo border-neon-indigo/50' : 'border-gray-800'}
      `}
        >
            {/* Mock Browser Header */}
            <div className="h-6 bg-gray-100 border-b flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto bg-white text-black p-4 relative">
                {children}
                {isOver && (
                    <div className="absolute inset-0 bg-neon-indigo/10 flex items-center justify-center pointer-events-none">
                        <span className="bg-neon-indigo text-white px-3 py-1 rounded text-xs font-bold shadow-lg">
                            Drop Here
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
