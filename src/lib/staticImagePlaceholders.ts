function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const brandLogoPlaceholder = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="26" fill="url(#g)"/>
    <circle cx="36" cy="88" r="10" fill="rgba(255,255,255,0.92)"/>
    <circle cx="84" cy="88" r="10" fill="rgba(255,255,255,0.92)"/>
    <path d="M24 34h14l8 8 42 0c7 0 10 8 6 13L83 73H40c-4 0-7-2-8-6l-8-33z" fill="rgba(255,255,255,0.92)"/>
    <path d="M32 34l28-16 34 13-34 17z" fill="rgba(255,255,255,0.98)"/>
  </svg>
`);

export const collegeBannerPlaceholder = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dff8f0"/>
        <stop offset="100%" stop-color="#dbeafe"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="24" fill="url(#g)"/>
    <path d="M18 48l42-18 42 18-42 18z" fill="#38bdf8"/>
    <path d="M28 59v19c0 6 14 12 32 12s32-6 32-12V59" fill="none" stroke="#84cc16" stroke-width="8" stroke-linecap="round"/>
    <path d="M24 82c10 8 24 12 36 12s26-4 36-12" fill="none" stroke="#84cc16" stroke-width="6" stroke-linecap="round"/>
  </svg>
`);

export const heroDesktopPlaceholder = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d9f5ff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sky)"/>
    <rect x="0" y="570" width="1600" height="330" fill="#dff2e3"/>
    <rect x="80" y="140" width="430" height="520" rx="18" fill="#b55b45"/>
    <rect x="140" y="200" width="200" height="280" fill="#dfe7ef"/>
    <rect x="560" y="90" width="480" height="250" rx="18" fill="#c36c52"/>
    <rect x="620" y="130" width="360" height="180" fill="#cdeaf2"/>
    <rect x="1090" y="120" width="420" height="540" rx="18" fill="#b85e47"/>
    <rect x="1160" y="200" width="250" height="290" fill="#dbe8ef"/>
    <rect x="620" y="360" width="370" height="300" rx="26" fill="#8fcb7d"/>
    <rect x="510" y="420" width="610" height="120" rx="26" fill="#e2c3a7"/>
    <circle cx="760" cy="560" r="110" fill="#f0d8c6"/>
    <circle cx="760" cy="560" r="76" fill="#b0d29d"/>
  </svg>
`);

export const heroMobilePlaceholder = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 932">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#def6ff"/>
        <stop offset="100%" stop-color="#fafaf9"/>
      </linearGradient>
    </defs>
    <rect width="430" height="932" fill="url(#sky)"/>
    <rect x="0" y="536" width="430" height="396" fill="#e6f5e7"/>
    <rect x="0" y="180" width="180" height="430" rx="18" fill="#b55b45"/>
    <rect x="16" y="230" width="92" height="250" fill="#dce6ef"/>
    <rect x="230" y="140" width="200" height="430" rx="18" fill="#b85e47"/>
    <rect x="250" y="220" width="150" height="230" fill="#dce9f2"/>
    <rect x="130" y="64" width="210" height="140" rx="18" fill="#c36c52"/>
    <rect x="145" y="88" width="180" height="100" fill="#cfeef5"/>
    <rect x="118" y="308" width="190" height="210" rx="20" fill="#8fcb7d"/>
    <rect x="86" y="444" width="268" height="90" rx="22" fill="#efcdb3"/>
    <circle cx="214" cy="566" r="92" fill="#f0dacc"/>
    <circle cx="214" cy="566" r="62" fill="#b2d59f"/>
  </svg>
`);

export const avatarPlaceholder = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d9f5ff"/>
        <stop offset="100%" stop-color="#dbeafe"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#g)"/>
    <circle cx="60" cy="48" r="22" fill="rgba(255,255,255,0.96)"/>
    <path d="M26 103c5-20 18-31 34-31 16 0 29 11 34 31" fill="rgba(255,255,255,0.96)"/>
  </svg>
`);
