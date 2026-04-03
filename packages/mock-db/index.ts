import { AppSchema } from '../schema/types';
import { INITIAL_SCHEMA } from './initial-data';

const STORAGE_KEY = 'lowcode_schema_v1';

export const MockDB = {
    getSchema: async (): Promise<AppSchema> => {
        // Try server first
        try {
            const res = await fetch('/api/schema');
            if (res.ok) {
                const data = await res.json();
                if (data && data.pages) return data;
            }
        } catch {}

        // Fallback to localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try { return JSON.parse(stored); } catch {}
            }
        }
        return INITIAL_SCHEMA;
    },

    saveSchema: async (schema: AppSchema): Promise<void> => {
        // Save to server
        try {
            await fetch('/api/schema', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schema),
            });
        } catch {}

        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
        }
    },

    reset: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
};
