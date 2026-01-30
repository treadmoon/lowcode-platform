import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-indigo/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content */}
      <div className="z-10 text-center max-w-2xl space-y-8">
        <h1 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">
          Low Code <br />
          <span className="text-neon-indigo">Next Generation</span>
        </h1>

        <p className="text-lg text-gray-400 font-light max-w-lg mx-auto leading-relaxed">
          Build powerful interfaces with a schema-driven engine. <br />
          Experience the future of development, today.
        </p>

        {/* Glass Cards / Actions */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
          <Link href="/studio" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-indigo rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative glass-panel rounded-xl px-8 py-6 flex flex-col items-center space-y-2 min-w-[200px] hover:bg-white/5 transition">
              <span className="text-2xl">🎨</span>
              <span className="font-semibold text-white tracking-wide">Enter Studio</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest">Design Mode</span>
            </div>
          </Link>

          <Link href="/runtime" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-emerald to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative glass-panel rounded-xl px-8 py-6 flex flex-col items-center space-y-2 min-w-[200px] hover:bg-white/5 transition">
              <span className="text-2xl">🚀</span>
              <span className="font-semibold text-white tracking-wide">Open Runtime</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest">Execute Mode</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="absolute bottom-6 text-xs text-gray-600 font-mono">
        SYSTEM_STATUS: <span className="text-neon-emerald">ONLINE</span> // v0.1.0-MVP
      </div>
    </div>
  );
}
