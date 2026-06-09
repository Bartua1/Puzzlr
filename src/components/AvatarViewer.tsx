// 1. Character Base Render
const CharacterBaseSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Body/Head base */}
    <circle cx="50" cy="52" r="32" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    {/* Blushing cheeks */}
    <circle cx="34" cy="58" r="5" fill="#FCA5A5" opacity="0.6" />
    <circle cx="66" cy="58" r="5" fill="#FCA5A5" opacity="0.6" />
    {/* Eyes */}
    <circle cx="38" cy="50" r="3.5" fill="#334155" />
    <circle cx="62" cy="50" r="3.5" fill="#334155" />
    {/* Smile */}
    <path d="M 44 60 Q 50 65 56 60" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 2. Knight Helmet Overlay/Thumbnail
const KnightHelmetSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    {/* Plume */}
    <path d="M 50 15 Q 65 5 70 20 Q 60 25 50 22" fill="#EF4444" />
    {/* Helmet dome */}
    <path d="M 28 48 C 28 25, 72 25, 72 48 C 72 54, 70 60, 68 64 C 50 66, 50 66, 32 64 C 30 60, 28 54, 28 48 Z" fill="#94A3B8" stroke="#475569" strokeWidth="2.5" />
    {/* Visor */}
    <path d="M 32 42 L 68 42 C 70 47, 70 51, 68 53 L 32 53 C 30 51, 30 47, 32 42 Z" fill="#475569" />
    {/* Visor slit */}
    <rect x="38" y="46" width="24" height="2" rx="1" fill="#FBBF24" />
    {/* Cheek protection lines */}
    <path d="M 32 56 L 36 68 L 44 65 Z" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
    <path d="M 68 56 L 64 68 L 56 65 Z" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
  </svg>
);

// 3. Wizard Hat/Robe Overlay/Thumbnail
const WizardSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full animate-pulse" : "w-full h-full"}>
    {/* Hat cone */}
    <path d="M 18 42 L 50 10 L 82 42 Z" fill="#6D28D9" stroke="#4C1D95" strokeWidth="2.5" />
    {/* Stars on Hat */}
    <polygon points="50,20 52,24 57,24 53,27 55,31 50,29 45,31 47,27 43,24 48,24" fill="#FBBF24" />
    <polygon points="38,30 39,32 42,32 40,34 41,36 38,35 35,36 36,34 34,32 37,32" fill="#FBBF24" />
    <polygon points="62,30 63,32 66,32 64,34 65,36 62,35 59,36 60,34 58,32 61,32" fill="#FBBF24" />
    {/* Hat brim */}
    <ellipse cx="50" cy="42" rx="36" ry="6" fill="#4C1D95" />
    {/* Robe collar */}
    {isOverlay && (
      <path d="M 25 78 Q 50 68 75 78 L 70 95 L 30 95 Z" fill="#6D28D9" opacity="0.9" />
    )}
  </svg>
);

// 3a. Astronaut Helmet Overlay/Thumbnail
const AstronautHelmetSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    <defs>
      <linearGradient id="astroVisor" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="astroHelmet" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
    {/* Base Collar / Neck Ring */}
    <path d="M 24 72 C 24 64, 76 64, 76 72 C 76 76, 24 76, 24 72 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
    <path d="M 28 73 C 28 68, 72 68, 72 73" fill="none" stroke="#EF4444" strokeWidth="2.5" />
    {/* Main White Dome */}
    <path d="M 20 48 C 20 22, 80 22, 80 48 C 80 64, 76 70, 70 73 C 50 75, 50 75, 30 73 C 24 70, 20 64, 20 48 Z" fill="url(#astroHelmet)" stroke="#94A3B8" strokeWidth="2.5" />
    {/* Visor Area */}
    <path d="M 26 46 C 26 34, 74 34, 74 46 C 74 58, 68 64, 50 64 C 32 64, 26 58, 26 46 Z" fill="url(#astroVisor)" stroke="#94A3B8" strokeWidth="2" />
    {/* Visor Reflection Shine */}
    <path d="M 32 40 Q 50 34 68 40 Q 50 38 32 40 Z" fill="#FFF" opacity="0.4" />
    {/* Side Communication Nodes */}
    <circle cx="18" cy="48" r="4" fill="#64748B" />
    <circle cx="82" cy="48" r="4" fill="#64748B" />
  </svg>
);

// 3b. Pirate Captain Hat & Eye Patch Overlay/Thumbnail
const PirateCaptainSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    <defs>
      <linearGradient id="pirateGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Eyepatch over left eye (which is cx=38, cy=50 in CharacterBase) */}
    {isOverlay && (
      <>
        {/* Eyepatch Strap */}
        <path d="M 12 40 L 88 56" stroke="#1E293B" strokeWidth="2.5" />
        {/* Eyepatch Cup */}
        <ellipse cx="38" cy="50" rx="8" ry="7" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
      </>
    )}
    {/* Pirate Hat (Tricorn) */}
    {/* Base brim curved upwards */}
    <path d="M 10 38 C 30 46, 70 46, 90 38 C 94 32, 94 28, 90 28 C 75 34, 25 34, 10 28 C 6 28, 6 32, 10 38 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
    {/* Crown of the hat */}
    <path d="M 22 30 C 22 10, 78 10, 78 30 Z" fill="#1E293B" />
    {/* Tricorn folded corners */}
    <path d="M 10 28 Q 24 16 38 28 Z" fill="#0F172A" />
    <path d="M 90 28 Q 76 16 62 28 Z" fill="#0F172A" />
    {/* Gold Trim on Brim */}
    <path d="M 10 32 C 30 40, 70 40, 90 32" fill="none" stroke="url(#pirateGold)" strokeWidth="1.5" />
    {/* Skull & Crossbones motif on Hat */}
    <circle cx="50" cy="22" r="3.5" fill="#FFF" />
    <path d="M 48 25.5 L 52 25.5 L 51 28 L 49 28 Z" fill="#FFF" />
    {/* Crossbones */}
    <line x1="45" y1="21" x2="55" y2="27" stroke="#FFF" strokeWidth="1" />
    <line x1="45" y1="27" x2="55" y2="21" stroke="#FFF" strokeWidth="1" />
  </svg>
);

// 3c. Cyberpunk Visor Overlay/Thumbnail
const CyberpunkVisorSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    <defs>
      <linearGradient id="cyberNeon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    {/* Visor plate covering both eyes (cx=38/62, cy=50) */}
    <rect x="16" y="42" width="68" height="15" rx="4" fill="url(#cyberNeon)" stroke="#FFF" strokeWidth="1" opacity="0.95" />
    {/* Glowing light streak */}
    <line x1="22" y1="46" x2="78" y2="46" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    {/* HUD markings */}
    <circle cx="24" cy="52" r="1.5" fill="#FFF" />
    <line x1="70" y1="52" x2="76" y2="52" stroke="#FFF" strokeWidth="1" />
    {/* Earpieces */}
    <path d="M 12 40 L 16 43 L 16 56 L 12 59 Z" fill="#334155" />
    <path d="M 88 40 L 84 43 L 84 56 L 88 59 Z" fill="#334155" />
  </svg>
);

// 3d. Ninja Cowl & Headband Overlay/Thumbnail
const NinjaCowlSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    {/* Cowl covering bottom half of face */}
    {isOverlay && (
      <path d="M 18 56 Q 30 52 50 52 Q 70 52 82 56 C 82 72, 76 84, 50 84 C 24 84, 18 72, 18 56 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
    )}
    {/* Forehead Headband */}
    <path d="M 18 30 C 30 27, 70 27, 82 30 L 80 37 C 70 34, 30 34, 20 37 Z" fill="#1E293B" />
    {/* Metal Plate */}
    <rect x="38" y="29" width="24" height="6" rx="1" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
    {/* Plate Rivets */}
    <circle cx="41" cy="32" r="0.6" fill="#475569" />
    <circle cx="59" cy="32" r="0.6" fill="#475569" />
    {/* Headband hanging ties at the side */}
    {isOverlay && (
      <path d="M 16 33 Q 8 36 12 48 Q 14 38 18 36 Z" fill="#0F172A" />
    )}
  </svg>
);

// 3e. Royal Crown & Cape Overlay/Thumbnail
const RoyalCrownSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    <defs>
      <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Velvet Cape */}
    {isOverlay && (
      <path d="M 23 76 C 23 76, 50 68, 77 76 L 73 95 L 27 95 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
    )}
    {/* Gold Crown */}
    <path d="M 26 34 L 30 20 L 40 28 L 50 16 L 60 28 L 70 20 L 74 34 Z" fill="url(#crownGold)" stroke="#B45309" strokeWidth="1.5" />
    {/* Crown Base Rim */}
    <rect x="25" y="32" width="50" height="4" rx="1" fill="#D97706" />
    {/* Jewels on Crown Peaks */}
    <circle cx="30" cy="20" r="2" fill="#EF4444" />
    <circle cx="50" cy="16" r="2" fill="#3B82F6" />
    <circle cx="70" cy="20" r="2" fill="#EF4444" />
    {/* Jewels on Crown Base Rim */}
    <circle cx="35" cy="34" r="1.2" fill="#10B981" />
    <circle cx="50" cy="34" r="1.2" fill="#FFF" />
    <circle cx="65" cy="34" r="1.2" fill="#10B981" />
  </svg>
);

// 3f. Detective Fedora & Monocle Overlay/Thumbnail
const DetectiveFedoraSVG = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <svg viewBox="0 0 100 100" className={isOverlay ? "absolute inset-0 w-full h-full" : "w-full h-full"}>
    {/* Monocle over right eye (which is cx=62, cy=50 in CharacterBase) */}
    {isOverlay && (
      <>
        {/* Monocle Glass & Gold Rim */}
        <circle cx="62" cy="50" r="8" fill="none" stroke="#FBBF24" strokeWidth="1.8" opacity="0.9" />
        {/* Monocle Chain */}
        <path d="M 70 50 Q 82 58 74 76" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 1" />
      </>
    )}
    {/* Fedora Hat */}
    {/* Hat Crown */}
    <path d="M 30 36 C 30 20, 70 20, 70 36 Z" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
    {/* Hat Band */}
    <rect x="29" y="31" width="42" height="5" fill="#1E293B" />
    {/* Hat Brim */}
    <ellipse cx="50" cy="36" rx="28" ry="4" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
  </svg>
);

// 4. Gold Badge SVG (Premium)
const GoldBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="30%" stopColor="#FDE68A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <radialGradient id="goldShimmer" cx="35%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeDasharray="5 2" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#FDE68A" strokeWidth="1" opacity="0.5" />
        {/* Crown ornament */}
        <path d="M 38 6 L 42 14 L 46 8 L 50 16 L 54 8 L 58 14 L 62 6 L 58 22 L 42 22 Z" fill="url(#goldGrad)" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="50" cy="5" r="2" fill="#FEF3C7" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#goldGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#goldShimmer)" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.25" />
        <circle cx="50" cy="50" r="20" fill="#FFF" opacity="0.12" />
        <path d="M 36 44 L 41 52 L 46 44 L 50 54 L 54 44 L 59 52 L 64 44 L 60 60 L 40 60 Z" fill="#FFF" opacity="0.9" />
        <circle cx="50" cy="48" r="2" fill="#FBBF24" opacity="0.8" />
      </>
    )}
  </svg>
);

// 5. Silver Badge SVG (Premium)
const SilverBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="35%" stopColor="#CBD5E1" />
        <stop offset="65%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <radialGradient id="silverShimmer" cx="30%" cy="30%" r="50%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="47" fill="none" stroke="#CBD5E1" strokeWidth="1" opacity="0.4" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#silverGrad)" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#E2E8F0" strokeWidth="0.8" opacity="0.5" />
        {/* Side wings */}
        <path d="M 6 48 Q -2 38 10 32 L 12 40 Z" fill="url(#silverGrad)" />
        <path d="M 94 48 Q 102 38 90 32 L 88 40 Z" fill="url(#silverGrad)" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#silverGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#silverShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.15" />
        {/* Star logo */}
        <polygon points="50,34 54,44 64,44 56,50 59,60 50,54 41,60 44,50 36,44 46,44" fill="#FFF" opacity="0.9" />
      </>
    )}
  </svg>
);

// 6. Diamond Frost Badge SVG
const DiamondBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="40%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
      <radialGradient id="diamondShimmer" cx="30%" cy="25%" r="45%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#diamondGrad)" strokeWidth="3.5" strokeDasharray="6 3" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#BAE6FD" strokeWidth="0.8" opacity="0.6" />
        {/* Diamond ornament at top */}
        <path d="M 44 4 L 50 14 L 56 4 L 52 18 L 48 18 Z" fill="url(#diamondGrad)" stroke="#0EA5E9" strokeWidth="0.6" />
        {/* Ice crystal accents */}
        <circle cx="50" cy="3" r="1.5" fill="#E0F2FE" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#diamondGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#diamondShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.15" />
        {/* Diamond gem facets */}
        <path d="M 50 34 L 62 46 L 50 62 L 38 46 Z" fill="#FFF" opacity="0.85" />
        <path d="M 50 34 L 56 46 L 50 62 Z" fill="#BAE6FD" opacity="0.4" />
        <path d="M 38 46 L 62 46 L 50 42 Z" fill="#FFF" opacity="0.5" />
      </>
    )}
  </svg>
);

// 7. Emerald Flame Badge SVG
const EmeraldBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="40%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
      <radialGradient id="emeraldShimmer" cx="35%" cy="30%" r="45%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#6EE7B7" strokeWidth="1" opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#emeraldGrad)" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#A7F3D0" strokeWidth="0.8" opacity="0.5" />
        {/* Leaf ornaments */}
        <path d="M 48 3 Q 42 10 48 18 Q 52 10 48 3 Z" fill="url(#emeraldGrad)" />
        <path d="M 52 3 Q 58 10 52 18 Q 48 10 52 3 Z" fill="#10B981" opacity="0.7" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#emeraldGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#emeraldShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.12" />
        {/* Leaf motif */}
        <path d="M 50 36 Q 62 42 58 56 Q 50 62 42 56 Q 38 42 50 36 Z" fill="#FFF" opacity="0.85" />
        <path d="M 50 36 L 50 58" stroke="#10B981" strokeWidth="1.5" opacity="0.4" />
        <path d="M 50 44 L 56 40" stroke="#10B981" strokeWidth="1" opacity="0.3" />
        <path d="M 50 50 L 44 46" stroke="#10B981" strokeWidth="1" opacity="0.3" />
      </>
    )}
  </svg>
);

// 8. Rose Crystal Badge SVG
const RoseBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBCFE8" />
        <stop offset="40%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      <radialGradient id="roseShimmer" cx="30%" cy="30%" r="45%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#F9A8D4" strokeWidth="1" opacity="0.35" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#roseGrad)" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#FBCFE8" strokeWidth="0.8" opacity="0.5" />
        {/* Petal ornaments at top */}
        <ellipse cx="46" cy="6" rx="4" ry="6" fill="url(#roseGrad)" opacity="0.8" transform="rotate(-15 46 6)" />
        <ellipse cx="54" cy="6" rx="4" ry="6" fill="#F472B6" opacity="0.6" transform="rotate(15 54 6)" />
        <circle cx="50" cy="8" r="2" fill="#FBCFE8" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#roseGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#roseShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.12" />
        {/* Crystal heart */}
        <path d="M 50 58 L 38 46 Q 38 36 50 40 Q 62 36 62 46 Z" fill="#FFF" opacity="0.85" />
        <path d="M 50 58 L 50 42 L 62 46 Z" fill="#FBCFE8" opacity="0.35" />
      </>
    )}
  </svg>
);

// 9. Neon Pulse Badge SVG
const NeonBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="neonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      <radialGradient id="neonShimmer" cx="40%" cy="30%" r="45%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.25" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#neonGrad)" strokeWidth="3.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="url(#neonGrad2)" strokeWidth="1" opacity="0.5" />
        {/* Electric sparkle accents */}
        <polygon points="50,2 51,6 54,3 52,7 55,6 52,9 50,14 48,9 45,6 48,7 46,3 49,6" fill="url(#neonGrad)" opacity="0.9" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#neonGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#neonShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.1" />
        {/* Lightning bolt */}
        <path d="M 54 34 L 46 50 L 52 50 L 46 66 L 58 46 L 52 46 L 56 34 Z" fill="#FFF" opacity="0.9" />
      </>
    )}
  </svg>
);

// 10. Sunset Blaze Badge SVG
const SunsetBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="35%" stopColor="#F97316" />
        <stop offset="70%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <radialGradient id="sunsetShimmer" cx="35%" cy="30%" r="45%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#FDBA74" strokeWidth="1" opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#sunsetGrad)" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#FED7AA" strokeWidth="0.8" opacity="0.5" />
        {/* Sun ray ornaments at top */}
        <line x1="50" y1="0" x2="50" y2="8" stroke="url(#sunsetGrad)" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="2" x2="44" y2="9" stroke="url(#sunsetGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="58" y1="2" x2="56" y2="9" stroke="url(#sunsetGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#sunsetGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#sunsetShimmer)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.12" />
        {/* Sun motif with rays */}
        <circle cx="50" cy="50" r="10" fill="#FFF" opacity="0.85" />
        <line x1="50" y1="34" x2="50" y2="38" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="50" y1="62" x2="50" y2="66" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="34" y1="50" x2="38" y2="50" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="62" y1="50" x2="66" y2="50" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="38" y1="38" x2="41" y2="41" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="62" y1="38" x2="59" y2="41" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="38" y1="62" x2="41" y2="59" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="62" y1="62" x2="59" y2="59" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </>
    )}
  </svg>
);

// 11. Cosmic Void Badge SVG
const CosmicBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="cosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4C1D95" />
        <stop offset="50%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <radialGradient id="cosmicGlow" cx="45%" cy="45%" r="40%">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
      </radialGradient>
    </defs>
    {showFrame ? (
      <>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#7C3AED" strokeWidth="1" opacity="0.25" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#cosmicGrad)" strokeWidth="3.5" strokeDasharray="2 3" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#A78BFA" strokeWidth="0.8" opacity="0.35" />
        {/* Star ornaments */}
        <polygon points="50,1 51,5 55,5 52,7 53,11 50,9 47,11 48,7 45,5 49,5" fill="#C4B5FD" />
        <circle cx="40" cy="5" r="1" fill="#DDD6FE" opacity="0.7" />
        <circle cx="60" cy="5" r="1" fill="#DDD6FE" opacity="0.7" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#cosmicGrad)" />
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#cosmicGlow)" />
        {/* Stars scattered */}
        <circle cx="35" cy="38" r="1.5" fill="#FFF" opacity="0.8" />
        <circle cx="60" cy="35" r="1" fill="#FFF" opacity="0.6" />
        <circle cx="65" cy="60" r="1.5" fill="#FFF" opacity="0.7" />
        <circle cx="38" cy="62" r="1" fill="#FFF" opacity="0.5" />
        <circle cx="55" cy="55" r="0.8" fill="#FFF" opacity="0.4" />
        {/* Spiral galaxy */}
        <path d="M 50 42 Q 58 42 58 50 Q 58 58 50 58 Q 42 58 42 50 Q 42 44 48 44 Q 54 44 54 50 Q 54 54 50 54 Q 47 54 47 50" fill="none" stroke="#FFF" strokeWidth="1.8" opacity="0.75" strokeLinecap="round" />
        <circle cx="50" cy="50" r="2" fill="#DDD6FE" opacity="0.9" />
      </>
    )}
  </svg>
);

// Unified renderer helper (exported so consumers like Shop.tsx can use it directly)
export const CosmeticGraphic = ({ assetKey, isOverlay = false, showFrame = false }: { assetKey: string; isOverlay?: boolean; showFrame?: boolean }) => {
  if (assetKey === 'cos_knight') return <KnightHelmetSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_wizard') return <WizardSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_astronaut') return <AstronautHelmetSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_pirate') return <PirateCaptainSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_cyber') return <CyberpunkVisorSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_ninja') return <NinjaCowlSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_royal') return <RoyalCrownSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_detective') return <DetectiveFedoraSVG isOverlay={isOverlay} />;
  if (assetKey === 'badge_gold') return <GoldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_silver') return <SilverBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_diamond') return <DiamondBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_emerald') return <EmeraldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_rose') return <RoseBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_neon') return <NeonBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_sunset') return <SunsetBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_cosmic') return <CosmicBadgeSVG showFrame={showFrame} />;
  return <CharacterBaseSVG />;
};

interface AvatarViewerProps {
  characterKey: string;
  badgeKey: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  borderClass?: string;
  shadowClass?: string;
  showBadgeTag?: boolean;
}

export const AvatarViewer = ({ 
  characterKey, 
  badgeKey, 
  size = 'lg',
  borderClass = 'border-slate-200',
  shadowClass = 'shadow-inner',
  showBadgeTag = size === 'lg'
}: AvatarViewerProps) => {
  const containerClass = 
    size === 'lg' ? 'w-36 h-36' : 
    size === 'md' ? 'w-12 h-12' : 
    size === 'sm' ? 'w-8 h-8' : 
    'w-6 h-6'; // 'xs'
  
  const badgeFrameScaleVal = 1.18;

  const badgeOverlaySize = 
    size === 'lg' ? 'w-5 h-5' : 
    size === 'md' ? 'w-4 h-4' : 
    size === 'sm' ? 'w-3 h-3' : 
    'w-2.5 h-2.5'; // 'xs'

  const badgeOverlayPos = 
    size === 'lg' ? '-bottom-1 -right-1' : 
    size === 'md' ? '-bottom-0.5 -right-0.5' : 
    size === 'sm' ? '-bottom-0.5 -right-0.5' : 
    '-bottom-0.5 -right-0.5'; // 'xs'

  return (
    <div className={`relative flex items-center justify-center ${containerClass}`}>
      {/* Outer Badge Border Glow Layer */}
      {badgeKey && (
        <div className="absolute inset-0" style={{ transform: `scale(${badgeFrameScaleVal})` }}>
          <CosmeticGraphic assetKey={badgeKey} showFrame={true} />
        </div>
      )}

      {/* Main Avatar Circle */}
      <div className={`w-full h-full bg-white rounded-full border-2 ${borderClass} flex items-center justify-center overflow-hidden relative ${shadowClass} z-10`}>
        {/* Base Character SVG */}
        <CosmeticGraphic assetKey="char_base" />

        {/* Costume/Outfit Overlay SVG */}
        {characterKey && characterKey !== 'char_base' && (
          <CosmeticGraphic assetKey={characterKey} isOverlay={true} />
        )}
      </div>

      {/* Tiny Badge Tag overlay at the bottom right */}
      {badgeKey && showBadgeTag && (
        <div className={`absolute ${badgeOverlayPos} bg-white border border-slate-200 shadow-sm p-0.5 rounded-full z-20`}>
          <div className={badgeOverlaySize}>
            <CosmeticGraphic assetKey={badgeKey} />
          </div>
        </div>
      )}
    </div>
  );
};
