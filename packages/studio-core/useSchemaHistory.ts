"use client";

import { useState, useCallback, useRef } from 'react';
import { AppSchema } from '../schema/types';

const MAX_HISTORY = 50;
const clone = (s: AppSchema) => JSON.parse(JSON.stringify(s));

export function useSchemaHistory() {
    const historyRef = useRef<AppSchema[]>([]);
    const pointerRef = useRef(-1);
    const [schema, _setSchema] = useState<AppSchema | null>(null);

    const initSchema = useCallback((s: AppSchema) => {
        const snapshot = clone(s);
        historyRef.current = [snapshot];
        pointerRef.current = 0;
        _setSchema(snapshot);
    }, []);

    const pushSchema = useCallback((s: AppSchema) => {
        const snapshot = clone(s);
        // Discard future states
        historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);
        historyRef.current.push(snapshot);
        // Enforce max depth
        if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
        } else {
            pointerRef.current++;
        }
        _setSchema(snapshot);
    }, []);

    const undo = useCallback(() => {
        if (pointerRef.current <= 0) return;
        pointerRef.current--;
        _setSchema(clone(historyRef.current[pointerRef.current]));
    }, []);

    const redo = useCallback(() => {
        if (pointerRef.current >= historyRef.current.length - 1) return;
        pointerRef.current++;
        _setSchema(clone(historyRef.current[pointerRef.current]));
    }, []);

    const canUndo = pointerRef.current > 0;
    const canRedo = pointerRef.current < historyRef.current.length - 1;

    return { schema, setSchema: pushSchema, initSchema, undo, redo, canUndo, canRedo };
}
