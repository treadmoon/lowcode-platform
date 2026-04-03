/**
 * Sandboxed JS execution for user-authored custom JS.
 * Restricts access to dangerous globals while providing state/dispatch/navigate.
 */
export function runSandboxedJs(
    code: string,
    state: Record<string, any>,
    dispatch: (action: any) => void,
    navigate: (path: string) => void
) {
    try {
        // Block dangerous globals by shadowing them as undefined
        // eslint-disable-next-line no-new-func
        const fn = new Function(
            'state', 'dispatch', 'navigate',
            'window', 'document', 'globalThis', 'self',
            'fetch', 'XMLHttpRequest', 'WebSocket',
            'eval', 'Function', 'importScripts',
            'localStorage', 'sessionStorage', 'indexedDB',
            'location', 'history', 'navigator',
            code
        );
        fn(
            state, dispatch, navigate,
            undefined, undefined, undefined, undefined,
            undefined, undefined, undefined,
            undefined, undefined, undefined,
            undefined, undefined, undefined,
            undefined, undefined, undefined
        );
    } catch (err) {
        console.error("[Sandbox] Custom JS Error:", err);
    }
}
