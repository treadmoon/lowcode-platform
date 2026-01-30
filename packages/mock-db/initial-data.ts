import { AppSchema } from '../schema/types';

export const INITIAL_SCHEMA: AppSchema = {
    initialState: {
        title: "Low Code MVP",
        count: 0,
        aiResponse: "Waiting..."
    },
    pages: [
        {
            id: "page-1",
            path: "/demo",
            components: [
                {
                    id: "header",
                    type: "Text",
                    props: { content: "Welcome to LowCode Studio", style: { fontSize: "24px", fontWeight: "bold" } }
                },
                {
                    id: "counter-display",
                    type: "Text",
                    props: { content: "Current Count: ${count}" }, // Interpolation syntax needed in Renderer
                    bindState: "count"
                },
                {
                    id: "btn-inc",
                    type: "Button",
                    props: { text: "Set Count to 10" },
                    onEvent: { click: "flow-inc" } // Mapping click event to flow-inc
                },
                {
                    id: "ai-result",
                    type: "Text",
                    props: { content: "AI Says: ${aiResponse}", style: { color: "blue" } },
                    bindState: "aiResponse"
                },
                {
                    id: "btn-ai",
                    type: "Button",
                    props: { text: "Ask AI Mock" },
                    onEvent: { click: "flow-ai" }
                }
            ],
            actions: [
                {
                    id: "flow-inc",
                    trigger: "click",
                    actions: [
                        {
                            type: "UpdateState",
                            path: "count",
                            value: 10
                        }
                    ]
                },
                {
                    id: "flow-ai",
                    trigger: "click",
                    actions: [
                        {
                            type: "AI",
                            prompt: "Hello AI",
                            outputStatePath: "aiResponse"
                        }
                    ]
                }
            ]
        }
    ]
};
