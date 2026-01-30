"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { runtimeReducer, RuntimeState, initialRuntimeState } from './reducer';
import { Action } from '../schema/types';

interface StoreContextType {
    state: RuntimeState;
    dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children, initialState = {} }: { children: ReactNode, initialState?: Record<string, any> }) => {
    // Merge passed initial state
    const init: RuntimeState = {
        data: { ...initialRuntimeState.data, ...initialState }
    };

    const [state, dispatch] = useReducer(runtimeReducer, init);

    return (
        <StoreContext.Provider value={{ state, dispatch }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
};
