import { ComponentSchema } from './types';

const VALID_TYPES = new Set([
    'Text', 'Button', 'Input', 'Container', 'Image',
    'Card', 'Divider', 'Checkbox', 'Switch', 'CustomComponent'
]);

// Maximum nesting depth to prevent deeply nested structures
const MAX_DEPTH = 10;

// Track seen IDs to detect circular references
const seenIds = new Set<string>();

export function validateComponent(comp: any, depth = 0): comp is ComponentSchema {
    if (!comp || typeof comp !== 'object') return false;
    if (depth > MAX_DEPTH) return false;

    // Check required fields
    if (typeof comp.id !== 'string' || !comp.id.trim()) return false;
    if (typeof comp.type !== 'string' || !VALID_TYPES.has(comp.type)) return false;
    if (typeof comp.props !== 'object' || comp.props === null) return false;

    // Detect circular references
    if (seenIds.has(comp.id)) return false;
    seenIds.add(comp.id);

    // Validate children recursively
    if (comp.children !== undefined) {
        if (!Array.isArray(comp.children)) return false;
        for (const child of comp.children) {
            if (!validateComponent(child, depth + 1)) {
                seenIds.clear();
                return false;
            }
        }
    }

    return true;
}

export function sanitizeComponents(components: any[], depth = 0): ComponentSchema[] {
    if (!Array.isArray(components)) return [];
    if (depth > MAX_DEPTH) return [];

    seenIds.clear();

    return components
        .filter((comp): comp is ComponentSchema => validateComponent(comp, depth))
        .map(comp => ({
            ...comp,
            id: comp.id || `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            children: comp.children ? sanitizeComponents(comp.children, depth + 1) : undefined
        }));
}

// Validate a full page schema
export function validatePageSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') return false;
    if (!Array.isArray(schema.pages)) return false;
    if (typeof schema.initialState !== 'object') return false;
    return true;
}

// Get validation errors for debugging (not exposed to client)
export function getValidationErrors(comp: any, path = ''): string[] {
    const errors: string[] = [];

    if (!comp || typeof comp !== 'object') {
        errors.push(`${path || 'root'}: not an object`);
        return errors;
    }

    if (typeof comp.id !== 'string') {
        errors.push(`${path}.id: must be a string`);
    }

    if (typeof comp.type !== 'string' || !VALID_TYPES.has(comp.type)) {
        errors.push(`${path}.type: must be one of ${[...VALID_TYPES].join(', ')}`);
    }

    if (typeof comp.props !== 'object' || comp.props === null) {
        errors.push(`${path}.props: must be an object`);
    }

    if (comp.children !== undefined) {
        if (!Array.isArray(comp.children)) {
            errors.push(`${path}.children: must be an array`);
        } else {
            comp.children.forEach((child: any, i: number) => {
                errors.push(...getValidationErrors(child, `${path}.children[${i}]`));
            });
        }
    }

    return errors;
}
