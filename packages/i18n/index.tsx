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
            error: "Syntax Error"
        },
        runtime: {
            title: "Runtime Preview",
            back: "Back to Studio",
            loading: "Loading Runtime..."
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
            error: "语法错误"
        },
        runtime: {
            title: "运行态预览",
            back: "返回工作室",
            loading: "运行态加载中..."
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
