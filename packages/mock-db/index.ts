import { AppSchema } from '../schema/types';
import { INITIAL_SCHEMA } from './initial-data';

const STORAGE_KEY = 'lowcode_schema_v1';

export const MockDB = {
    getSchema: async (): Promise<AppSchema> => {
        // Simulate latency
        await new Promise(r => setTimeout(r, 100));

        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error("Failed to parse stored schema", e);
                }
            }
        }
        return INITIAL_SCHEMA;
    },

    saveSchema: async (schema: AppSchema): Promise<void> => {
        await new Promise(r => setTimeout(r, 100));
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
