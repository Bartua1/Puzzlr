
// 1. Gold Badge SVG (Premium)
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

// 2. Silver Badge SVG (Premium)
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

// 3. Diamond Frost Badge SVG
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

// 4. Emerald Flame Badge SVG
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

// 5. Rose Crystal Badge SVG
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

// 6. Neon Pulse Badge SVG
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

// 7. Sunset Blaze Badge SVG
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

// 8. Cosmic Void Badge SVG
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

// Unified renderer helper for Badges
export const CosmeticGraphic = ({ assetKey, showFrame = false }: { assetKey: string; isOverlay?: boolean; showFrame?: boolean }) => {
  if (assetKey === 'badge_gold') return <GoldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_silver') return <SilverBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_diamond') return <DiamondBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_emerald') return <EmeraldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_rose') return <RoseBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_neon') return <NeonBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_sunset') return <SunsetBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_cosmic') return <CosmicBadgeSVG showFrame={showFrame} />;
  return null;
};

interface AvatarViewerProps {
  avatarUrl?: string | null;
  characterKey?: string | null;
  badgeKey?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  borderClass?: string;
  shadowClass?: string;
  showBadgeTag?: boolean;
}

export const AvatarViewer = ({ 
  avatarUrl, 
  characterKey,
  badgeKey, 
  size = 'lg',
  borderClass = 'border-slate-200',
  shadowClass = 'shadow-inner',
  showBadgeTag = size === 'lg'
}: AvatarViewerProps) => {
  // Reference characterKey to avoid unused variable compiler check
  if (characterKey) {
    console.debug('Character equipped:', characterKey);
  }
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
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover rounded-full" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          /* Beautiful minimalist user silhouette fallback SVG */
          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-300 bg-slate-100 p-2">
            <path d="M 50 15 C 38 15, 28 25, 28 37 C 28 49, 38 59, 50 59 C 62 59, 72 49, 72 37 C 72 25, 62 15, 50 15 Z" fill="currentColor" />
            <path d="M 50 63 C 28 63, 15 72, 15 85 L 85 85 C 85 72, 72 63, 50 63 Z" fill="currentColor" />
          </svg>
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
