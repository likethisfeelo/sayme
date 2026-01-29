/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors (차분함)
        'primary-beige': '#F5F1ED',
        'primary-beige-soft': '#F9F6F3',
        'primary-warm-gray': '#E0DCD8',
        'primary-charcoal': '#3A3A3A',
        'primary-warm-black': '#2A2725',
        
        // Secondary Colors (브랜드 가이드)
        'secondary-sand': '#E5DDD5',
        'secondary-terracotta': '#C17959',
        'secondary-sage': '#A9B4A0',
        'secondary-dark-gray': '#5A5A5A',
        
        // Pastel Accent Colors (설렘)
        'pastel-lavender': '#E8DFF5',
        'pastel-mint': '#D4EDE4',
        'pastel-peach': '#FFE8D6',
        'pastel-rose': '#F4E3E5',
        'pastel-sky': '#E3EEF8',
        
        // Legacy Pastel Colors (기존 호환성)
        'pastel-purple': '#E8DFF5',
        'pastel-pink': '#FFC1D9',
        'pastel-blue': '#7BCBFF',
      },
      fontFamily: {
        sans: ['Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Nanum Myeongjo', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delay-1': 'float 6s ease-in-out 2s infinite',
        'float-delay-2': 'float 6s ease-in-out 4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      boxShadow: {
        'calm': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft': '0 8px 24px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}