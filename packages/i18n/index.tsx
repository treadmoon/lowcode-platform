"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

const translations = {
    en: {
        home: {
            title: "Low Code",
            subtitle: "Next Generation",
            desc: "Build powerful interfaces with a schema-driven engine.\nExperience the future of development, today.",
            enterStudio: "Enter Studio",
            enterStudioDesc: "Design Mode",
            openRuntime: "Open Runtime",
            openRuntimeDesc: "Execute Mode",
            status: "SYSTEM_STATUS",
            online: "ONLINE"
        },
        studio: {
            schema: "Schema.json",
            save: "SAVE CHANGES",
            saving: "SAVING...",
            saved: "SAVED!",
            preview: "LIVE PREVIEW",
            desktop: "DESKTOP",
            openRuntime: "OPEN RUNTIME",
            error: "Syntax Error",
            workspace: "Workspace",
            untitled: "Untitled Page"
        },
        runtime: {
            title: "Runtime Preview",
            back: "Back to Studio",
            loading: "Loading Runtime..."
        },
        components: {
            Text: "Text",
            Button: "Button",
            Input: "Input",
            Image: "Image",
            Container: "Container",
            Card: "Card",
            Divider: "Divider",
            Checkbox: "Checkbox",
            Switch: "Switch"
        },
        inspector: {
            properties: "Properties",
            appearance: "Appearance",
            layout: "Layout",
            content: "Content",
            label: "Label",
            width: "Width",
            height: "Height",
            src: "Source URL",
            padding: "Padding",
            gap: "Gap",
            direction: "Direction",
            alignItems: "Align Items",
            justifyContent: "Justify Content",
            flexWrap: "Wrap",
            customStyle: "Custom Style (JSON)",
            initialState: "Initial State",
            placeholder: "Placeholder",
            msg_delete: "Delete Component",
            msg_empty: "Use ${state.path} to bind properties to the application state.",
            options: {
                row: "Row",
                column: "Col",
                start: "Start",
                center: "Center",
                end: "End",
                stretch: "Stretch",
                spaceBetween: "Space Between",
                wrap: "Wrap",
                nowrap: "No",
                true: "True / On",
                false: "False / Off",
                block: "Block",
                flex: "Flex"
            },
            flexLayout: "Flexbox Layout"
        },
        ui: {
            components: "Components",
            schema: "Schema",
            searchPlaceholder: "Search components...",
            emptySelectionTitle: "Empty Selection",
            emptySelectionDesc: "Pick a component from the workspace to view and edit its properties",
            emptyContainer: "Container (Drop Here)",
            emptyCard: "Card Content Area",
            moving: "Moving Component"
        }
    },
    zh: {
        home: {
            title: "低代码平台",
            subtitle: "下一代引擎",
            desc: "使用模式驱动引擎构建强大的界面。\n立即体验开发的未来。",
            enterStudio: "进入工作室",
            enterStudioDesc: "设计模式",
            openRuntime: "打开运行态",
            openRuntimeDesc: "执行模式",
            status: "系统状态",
            online: "在线"
        },
        studio: {
            schema: "架构定义 (Schema.json)",
            save: "保存更改",
            saving: "保存中...",
            saved: "已保存!",
            preview: "实时预览",
            desktop: "桌面端",
            openRuntime: "打开运行态",
            error: "语法错误",
            workspace: "工作区",
            untitled: "未命名页面"
        },
        runtime: {
            title: "运行态预览",
            back: "返回工作室",
            loading: "运行态加载中..."
        },
        components: {
            Text: "文本段落",
            Button: "按钮",
            Input: "输入框",
            Image: "图片",
            Container: "容器",
            Card: "卡片",
            Divider: "分隔线",
            Checkbox: "复选框",
            Switch: "开关"
        },
        inspector: {
            properties: "基础属性",
            appearance: "外观样式",
            layout: "排版布局",
            content: "文本内容",
            label: "标签文本",
            width: "宽度",
            height: "高度",
            src: "图片链接",
            padding: "内边距",
            gap: "间距",
            direction: "排列方向",
            alignItems: "垂直对齐",
            justifyContent: "水平分布",
            flexWrap: "自动换行",
            customStyle: "自定义样式 (JSON)",
            initialState: "初始状态",
            placeholder: "占位提示",
            msg_delete: "删除组件",
            msg_empty: "使用 ${state.path} 将属性绑定到应用状态。",
            options: {
                row: "水平",
                column: "垂直",
                start: "起始",
                center: "居中",
                end: "末尾",
                stretch: "拉伸",
                spaceBetween: "两端对齐",
                wrap: "换行",
                nowrap: "不换行",
                true: "开启",
                false: "关闭",
                block: "块级",
                flex: "弹性"
            },
            flexLayout: "弹性布局"
        },
        ui: {
            components: "组件库",
            schema: "架构 JSON",
            searchPlaceholder: "搜索组件...",
            emptySelectionTitle: "未选中组件",
            emptySelectionDesc: "在画布中选择一个组件以查看和编辑属性",
            emptyContainer: "容器 (拖入组件)",
            emptyCard: "卡片内容区域",
            moving: "正在移动组件"
        }
    }
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const saved = localStorage.getItem('lowcode_lang') as Language;
        if (saved && (saved === 'en' || saved === 'zh')) {
            setLanguage(saved);
        }
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('lowcode_lang', lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let value: any = translations[language];
        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                return path; // Fallback to key if missing
            }
        }
        return value as string;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
};
