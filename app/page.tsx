"use client";

import Link from 'next/link';
import { LanguageProvider, useTranslation } from '../packages/i18n';

function HomeContent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <div className="glass-panel rounded-full p-1 flex">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('zh')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'zh' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            中文
          </button>
        </div>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-indigo/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content */}
      <div className="z-10 text-center max-w-2xl space-y-8">
        <h1 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">
          {t('home.title')} <br />
          <span className="text-neon-indigo">{t('home.subtitle')}</span>
        </h1>

        <p className="text-lg text-gray-400 font-light max-w-lg mx-auto leading-relaxed whitespace-pre-line">
          {t('home.desc')}
        </p>

        {/* Glass Cards / Actions */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
          <Link href="/studio" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-indigo rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative glass-panel rounded-xl px-8 py-6 flex flex-col items-center space-y-2 min-w-[200px] hover:bg-white/5 transition">
              <span className="text-2xl">🎨</span>
              <span className="font-semibold text-white tracking-wide">{t('home.enterStudio')}</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest">{t('home.enterStudioDesc')}</span>
            </div>
          </Link>

          <Link href="/runtime" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-emerald to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative glass-panel rounded-xl px-8 py-6 flex flex-col items-center space-y-2 min-w-[200px] hover:bg-white/5 transition">
              <span className="text-2xl">🚀</span>
              <span className="font-semibold text-white tracking-wide">{t('home.openRuntime')}</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest">{t('home.openRuntimeDesc')}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="absolute bottom-6 text-xs text-gray-600 font-mono">
        {t('home.status')}: <span className="text-neon-emerald">{t('home.online')}</span> // v0.1.0-MVP
      </div>
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
