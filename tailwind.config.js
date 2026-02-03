/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./packages/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-outfit)', 'sans-serif'],
                display: ['var(--font-cal)', 'sans-serif'],
            },
            colors: {
                // Deep Ocean Palette (Blue/Cyan/Slate)
                primary: {
                    DEFAULT: '#3b82f6', // Blue 500
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
                secondary: {
                    DEFAULT: '#06b6d4', // Cyan 500
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                },
                // Neutral scales for depth
                slate: {
                    850: '#151f32', // Deep background
                    900: '#0f172a',
                    950: '#020617',
                },
                // Mapping old tokens to new system for backward compatibility
                antd: {
                    primary: '#6366f1',
                    success: '#10b981', // Emerald 500
                    warning: '#f59e0b', // Amber 500
                    error: '#ef4444',   // Red 500
                    bg: {
                        default: '#f8fafc',  // Slate 50
                        container: '#ffffff',
                        hover: '#f1f5f9',    // Slate 100
                    },
                    border: '#e2e8f0', // Slate 200
                    divider: '#f1f5f9', // Slate 100
                    text: {
                        primary: '#0f172a',   // Slate 900
                        secondary: '#475569', // Slate 600
                        tertiary: '#94a3b8',  // Slate 400
                        quaternary: '#cbd5e1', // Slate 300
                    },
                    action: {
                        hover: '#4f46e5', // Indigo 600
                        active: '#4338ca', // Indigo 700
                        selected: '#e0e7ff', // Indigo 100
                    }
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
                'grid-pattern': 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            },
            boxShadow: {
                'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
                'glass-hover': '0 10px 40px rgba(0, 0, 0, 0.1)',
                'float': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'glow': '0 0 20px rgba(99, 102, 241, 0.5)',
                // Antd compatibility
                'antd-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'antd-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'antd-float': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
