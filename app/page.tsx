"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LanguageProvider, useTranslation } from '../packages/i18n';
import { ArrowRight, Sparkles, Zap, Layers } from 'lucide-react';

function HomeContent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/30 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/30 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-pink-500/30 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold shadow-lg">
            A
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Antigravity
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass px-1 py-1 rounded-full flex gap-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${language === 'en' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${language === 'zh' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              中文
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-slate-200 backdrop-blur-sm text-sm font-medium text-slate-600 mb-8 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          v0.1.0 Beta Available
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl"
        >
          {t('home.title')} <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
            {t('home.subtitle')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed"
        >
          {t('home.desc')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/studio" className="group">
            <button className="h-14 px-8 rounded-full bg-slate-900 text-white font-semibold text-lg flex items-center gap-2 hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
              <Sparkles size={20} className="text-yellow-300" />
              {t('home.enterStudio')}
            </button>
          </Link>
          <Link href="/runtime">
            <button className="h-14 px-8 rounded-full bg-white text-slate-900 border border-slate-200 font-semibold text-lg flex items-center gap-2 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Zap size={20} className="text-slate-400" />
              {t('home.openRuntime')}
            </button>
          </Link>
        </motion.div>

        {/* Feature Cards Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          <div className="glass p-8 rounded-3xl flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Drag & Drop</h3>
            <p className="text-slate-500 leading-relaxed">Intuitive visual editor with smart snapping and automatic layouts.</p>
          </div>
          <div className="glass p-8 rounded-3xl flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">AI Powered</h3>
            <p className="text-slate-500 leading-relaxed">Generate components and flows instantly with integrated AI assistants.</p>
          </div>
          <div className="glass p-8 rounded-3xl flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Production Ready</h3>
            <p className="text-slate-500 leading-relaxed">Export clean, optimized React code that scales with your needs.</p>
          </div>
        </motion.div>

      </main>

      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}
