import { Action, ActionFlow } from '../schema/types';
import { mockAIRequest } from '../ai-mock';

// Context passed to the engine at Runtime
export interface RuntimeContext {
    dispatch: (action: Action) => void;
    state: Record<string, any>; // Read-only access to current state? Or get access via store?
    navigate: (path: string) => void; // Wrapped Next.js router.push
}

export async function runActionFlow(flow: ActionFlow, context: RuntimeContext) {
    console.log(`[ActionEngine] Starting Flow: ${flow.id}`);

    for (const action of flow.actions) {
        console.log(`[ActionEngine] Executing Action: ${action.type}`, action);

        try {
            await executeAction(action, context);
        } catch (error) {
            console.error(`[ActionEngine] Action failed:`, error);
            // MVP: Stop execution on error
            break;
        }
    }

    console.log(`[ActionEngine] Flow Complete: ${flow.id}`);
}

async function executeAction(action: Action, context: RuntimeContext) {
    switch (action.type) {
        case 'UpdateState':
            // Dispatch directly to store reducer
            context.dispatch(action);
            break;

        case 'Navigate':
            context.navigate(action.path);
            break;

        case 'Request':
            // Mock Request
            console.log(`[ActionEngine] Mock Request: ${action.method} ${action.url}`, action.body);
            await new Promise(r => setTimeout(r, 500));
            // Implementation of "responseMapping" would go here (update state with result)
            // MVP: Just log it.
            break;

        case 'AI':
            const result = await mockAIRequest(action.prompt);
            // Write result to state
            context.dispatch({
                type: 'UpdateState',
                path: action.outputStatePath,
                value: result.result
            });
            break;

        default:
            console.warn(`[ActionEngine] Unknown action type: ${(action as any).type}`);
    }
}
