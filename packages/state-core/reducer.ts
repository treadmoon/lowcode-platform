import { Action } from '../schema/types';

export interface RuntimeState {
    data: Record<string, any>;
}

export const initialRuntimeState: RuntimeState = {
    data: {}
};

export function runtimeReducer(state: RuntimeState, action: Action): RuntimeState {
    switch (action.type) {
        case 'UpdateState': {
            // Simple path update. For MVP, assuming top-level keys or simple dot notation if I implement it.
            // Spec says "UpdateStateAction".
            // Let's implement simple top-level for now, or basic nested if easy.
            // Implementation: shallow merge for simplicity unless lodash/set is imported.
            // I'll stick to top-level for MVP safety or simple key assignment.

            const { path, value } = action;
            return {
                ...state,
                data: {
                    ...state.data,
                    [path]: value
                }
            };
        }
        // Other actions (Navigate, Request, AI) are side-effects, 
        // handled by ActionEngine, not Reducer directly?? 
        // OR Reducer handles state updates resulting from them?
        // The Spec says: "Action Flow... 顺序执行 actions". "Action Engine... 执行接口 runActionFlow". 
        // So ActionEngine coordinates. When it encounters UpdateState, it dispatches to Store.
        // When it encounters AI, it runs AI, gets result, THEN dispatches UpdateState (or the AI action modifies state directly?)
        // Spec: "AI Action ... 返回 mock 数据并写入 state".
        // So AI Action *implies* a state update.
        // 'AIAction' in schema: `outputStatePath`.
        // So the engine runs AI, gets result, then dispatches an UpdateState(outputStatePath, result).
        // Thus Reducer ONLY needs to handle 'UpdateState'.
        // BUT, the Action type in Schema includes all of them.
        // So `dispatch(action)` where action is AIAction?
        // If so, the Reducer can't run async code.
        // So ActionEngine must run the flow, and dispatch *synchronous* state updates.
        // So the Store should probably just handle 'SET_STATE' or 'UPDATE_STATE'.
        // But the `action` argument in reducer is strongly typed as `Action` (from Schema).
        // If I pass `AIAction` to reducer, it does nothing.
        // Correct. The Engine handles the "Effect", the Reducer handles the "State Change".
        // I will add a generic 'SET_DATA' generic action or just reuse UpdateStateAction.

        default:
            return state;
    }
}
