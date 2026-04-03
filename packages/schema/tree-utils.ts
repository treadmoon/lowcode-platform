import { ComponentSchema } from './types';

export const findContainer = (id: string, components: ComponentSchema[]): string | undefined => {
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

export const findComponentById = (components: ComponentSchema[], id: string): ComponentSchema | null => {
    for (const comp of components) {
        if (comp.id === id) return comp;
        if (comp.children) {
            const found = findComponentById(comp.children, id);
            if (found) return found;
        }
    }
    return null;
};

export const updateComponentProps = (components: ComponentSchema[], id: string, newProps: any): ComponentSchema[] => {
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

export const insertItem = (components: ComponentSchema[], containerId: string, item: ComponentSchema, index: number): ComponentSchema[] => {
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

export const removeItem = (components: ComponentSchema[], id: string): ComponentSchema[] => {
    return components.filter(c => c.id !== id).map(c => ({
        ...c,
        children: c.children ? removeItem(c.children, id) : []
    }));
};

export const moveItemInTree = (rootComponents: ComponentSchema[], activeId: string, overId: string) => {
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

export const moveItemIntoContainer = (rootComponents: ComponentSchema[], activeId: string, targetContainerId: string) => {
    let newComponents = [...rootComponents];
    const activeItem = findComponentById(newComponents, activeId);
    if (!activeItem) return newComponents;

    const check = findComponentById([activeItem], targetContainerId);
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

    if (targetContainerId === 'root-canvas') {
        newComponents.push(activeItem);
        return newComponents;
    }

    return updateContainer(newComponents);
};

export const deepCloneComponent = (comp: ComponentSchema): ComponentSchema => {
    return {
        ...comp,
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        children: comp.children ? comp.children.map(deepCloneComponent) : undefined
    };
};
