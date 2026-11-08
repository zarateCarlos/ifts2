/** Pared de azulejos + detalles de cocina (SVG, sin foto). */
export function HeroKitchenWall() {
  return (
    <div className="hero-kitchen" aria-hidden>
      <svg
        className="hero-kitchen__svg"
        viewBox="0 0 720 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <pattern
            id="azulejo"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <rect width="48" height="48" fill="#e7efe8" />
            <rect
              x="0.5"
              y="0.5"
              width="47"
              height="47"
              fill="none"
              stroke="#c5d6c9"
              strokeWidth="1"
            />
            <circle cx="24" cy="24" r="5.5" fill="none" stroke="#9fb8a7" strokeWidth="1.1" />
            <path
              d="M24 14.5v19M14.5 24h19"
              stroke="#b7ccbd"
              strokeWidth="0.7"
              opacity="0.7"
            />
            <circle cx="24" cy="24" r="1.6" fill="#8fad9a" opacity="0.55" />
          </pattern>
          <linearGradient id="wallShade" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#f3efe6" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#f3efe6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f3efe6" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="warmLight" cx="72%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#fff4d6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fff4d6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shelfWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9c4a0" />
            <stop offset="100%" stopColor="#b9956a" />
          </linearGradient>
          <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8b07a" />
            <stop offset="55%" stopColor="#c9844a" />
            <stop offset="100%" stopColor="#9a5a2e" />
          </linearGradient>
        </defs>

        {/* Pared */}
        <rect x="180" y="0" width="540" height="900" fill="url(#azulejo)" />
        <rect x="180" y="0" width="540" height="900" fill="url(#warmLight)" />
        <rect x="0" y="0" width="720" height="900" fill="url(#wallShade)" />

        {/* Estante */}
        <rect x="250" y="210" width="380" height="14" rx="2" fill="url(#shelfWood)" />
        <rect x="250" y="224" width="380" height="5" fill="#a88355" opacity="0.45" />

        {/* Frascos */}
        <g transform="translate(290 148)">
          <rect x="0" y="18" width="36" height="44" rx="4" fill="#f7fbf8" stroke="#7d9a88" />
          <rect x="4" y="8" width="28" height="12" rx="2" fill="#c5a46a" />
          <ellipse cx="18" cy="48" rx="12" ry="6" fill="#d8e6de" />
        </g>
        <g transform="translate(350 138)">
          <rect x="0" y="18" width="32" height="54" rx="4" fill="#eef6f1" stroke="#7d9a88" />
          <rect x="3" y="8" width="26" height="12" rx="2" fill="#8fad9a" />
          <path d="M8 42h16" stroke="#b7ccbd" strokeWidth="2" />
        </g>
        <g transform="translate(410 152)">
          <rect x="0" y="18" width="40" height="40" rx="5" fill="#f7fbf8" stroke="#7d9a88" />
          <rect x="5" y="8" width="30" height="12" rx="2" fill="#c5a46a" />
          <circle cx="20" cy="42" r="8" fill="#d8e6de" />
        </g>

        {/* Ollas colgando */}
        <g stroke="#5a6b5e" strokeWidth="1.4" fill="none">
          <path d="M480 224v18" />
          <path d="M545 224v18" />
          <path d="M610 224v18" />
        </g>
        <g>
          <ellipse cx="480" cy="268" rx="28" ry="10" fill="#c4d3c9" stroke="#6d8576" />
          <path
            d="M452 268c2 28 14 42 28 42s26-14 28-42"
            fill="#d7e4dc"
            stroke="#6d8576"
          />
          <path d="M460 255h40" stroke="#6d8576" strokeWidth="2" />
        </g>
        <g>
          <ellipse cx="545" cy="262" rx="22" ry="8" fill="url(#copper)" stroke="#8a6a45" />
          <path
            d="M523 262c2 24 11 36 22 36s20-12 22-36"
            fill="#e0c19a"
            stroke="#8a6a45"
          />
          <path d="M530 250h30" stroke="#8a6a45" strokeWidth="2" />
        </g>
        <g>
          <ellipse cx="610" cy="270" rx="26" ry="9" fill="#b9c9bf" stroke="#6d8576" />
          <path
            d="M584 270c2 30 13 44 26 44s24-14 26-44"
            fill="#cddbd3"
            stroke="#6d8576"
          />
          <path d="M592 257h36" stroke="#6d8576" strokeWidth="2" />
        </g>

        {/* Segundo estante + utensilios */}
        <rect x="270" y="420" width="340" height="12" rx="2" fill="url(#shelfWood)" />
        <rect x="270" y="432" width="340" height="4" fill="#a88355" opacity="0.4" />

        {/* Tabla */}
        <ellipse cx="330" cy="405" rx="42" ry="12" fill="#c9a67a" stroke="#9a7548" />
        <ellipse cx="330" cy="402" rx="36" ry="8" fill="#ddc09a" opacity="0.7" />

        {/* Cuchillos / espátula */}
        <g transform="translate(400 360)">
          <rect x="0" y="0" width="6" height="52" rx="2" fill="#d8e6de" stroke="#6d8576" />
          <rect x="14" y="4" width="5" height="48" rx="2" fill="#e8c56a" stroke="#9a7548" />
          <rect x="28" y="8" width="5" height="44" rx="2" fill="#d8e6de" stroke="#6d8576" />
        </g>

        {/* Cuenco */}
        <g transform="translate(500 378)">
          <ellipse cx="36" cy="36" rx="36" ry="12" fill="#8fad9a" opacity="0.35" />
          <path
            d="M4 28c4 28 20 40 32 40s28-12 32-40"
            fill="#eef6f1"
            stroke="#6d8576"
          />
          <ellipse cx="36" cy="28" rx="32" ry="9" fill="#f7fbf8" stroke="#6d8576" />
        </g>

        {/* Mesa inferior */}
        <rect x="220" y="640" width="460" height="18" rx="3" fill="url(#shelfWood)" />
        <rect x="220" y="658" width="460" height="6" fill="#8f6a3f" opacity="0.35" />
        <rect x="250" y="664" width="14" height="120" fill="#b9956a" opacity="0.55" />
        <rect x="620" y="664" width="14" height="120" fill="#b9956a" opacity="0.55" />

        {/* Plato + hierbas en mesa */}
        <ellipse cx="360" cy="628" rx="48" ry="14" fill="#eef6f1" stroke="#7d9a88" />
        <ellipse cx="360" cy="624" rx="34" ry="9" fill="#d8e6de" />
        <g transform="translate(450 600)" stroke="#5f8a4c" fill="none" strokeWidth="1.5">
          <path d="M20 40c-2-18 6-32 14-36" />
          <path d="M28 40c2-16 10-28 18-30" />
          <path d="M24 22c-8-2-12 4-10 10" />
          <path d="M34 18c8-1 12 6 8 12" />
        </g>

        {/* Tetera */}
        <g transform="translate(540 575)">
          <ellipse cx="40" cy="58" rx="38" ry="12" fill="#c5d6c9" opacity="0.5" />
          <path
            d="M12 50c2-28 16-42 28-42s26 14 28 42"
            fill="#eef6f1"
            stroke="#6d8576"
          />
          <ellipse cx="40" cy="18" rx="16" ry="6" fill="#d8e6de" stroke="#6d8576" />
          <path d="M68 36c18 2 22 14 10 22" fill="none" stroke="#6d8576" strokeWidth="3" />
          <rect x="34" y="4" width="12" height="10" rx="2" fill="#8fad9a" />
        </g>

        {/* Luz de ventana (sugerida) */}
        <rect
          x="560"
          y="80"
          width="120"
          height="90"
          rx="4"
          fill="#fff8e8"
          opacity="0.25"
          stroke="#c5d6c9"
          strokeWidth="1.5"
        />
        <path d="M620 80v90M560 125h120" stroke="#c5d6c9" strokeWidth="1.2" opacity="0.6" />
      </svg>
    </div>
  )
}
