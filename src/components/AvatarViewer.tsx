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

// 4. Gold Badge SVG
const GoldBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {showFrame ? (
      <>
        {/* Glow Frame */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeDasharray="4 2" />
        {/* Top crown ornament */}
        <path d="M 40 8 L 45 15 L 50 8 L 55 15 L 60 8 L 56 20 L 44 20 Z" fill="url(#goldGrad)" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#goldGrad)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.2" />
        {/* Crown logo */}
        <path d="M 38 42 L 43 50 L 50 42 L 57 50 L 62 42 L 59 58 L 41 58 Z" fill="#FFF" />
      </>
    )}
  </svg>
);

// 5. Silver Badge SVG
const SilverBadgeSVG = ({ showFrame = false }: { showFrame?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    {showFrame ? (
      <>
        {/* Silver Frame */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#silverGrad)" strokeWidth="3" />
        {/* Side wings */}
        <path d="M 8 50 Q 0 40 12 35 Z" fill="url(#silverGrad)" />
        <path d="M 92 50 Q 100 40 88 35 Z" fill="url(#silverGrad)" />
      </>
    ) : (
      <>
        <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#silverGrad)" />
        <circle cx="50" cy="50" r="22" fill="#FFF" opacity="0.2" />
        {/* Star logo */}
        <polygon points="50,36 53,44 62,44 55,49 58,58 50,52 42,58 45,49 38,44 47,44" fill="#FFF" />
      </>
    )}
  </svg>
);

// Unified renderer helper (exported so consumers like Shop.tsx can use it directly)
export const CosmeticGraphic = ({ assetKey, isOverlay = false, showFrame = false }: { assetKey: string; isOverlay?: boolean; showFrame?: boolean }) => {
  if (assetKey === 'cos_knight') return <KnightHelmetSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_wizard') return <WizardSVG isOverlay={isOverlay} />;
  if (assetKey === 'badge_gold') return <GoldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_silver') return <SilverBadgeSVG showFrame={showFrame} />;
  return <CharacterBaseSVG />;
};

interface AvatarViewerProps {
  characterKey: string;
  badgeKey: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AvatarViewer = ({ characterKey, badgeKey, size = 'lg' }: AvatarViewerProps) => {
  const containerClass = 
    size === 'lg' ? 'w-36 h-36' : 
    size === 'md' ? 'w-12 h-12' : 
    size === 'sm' ? 'w-8 h-8' : 
    'w-6 h-6'; // 'xs'
  
  const badgeFrameScale = 
    size === 'lg' ? 'scale-110' : 
    size === 'md' ? 'scale-[1.08]' : 
    size === 'sm' ? 'scale-[1.06]' : 
    'scale-[1.04]'; // 'xs'

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
    <div className="relative flex items-center justify-center">
      {/* Outer Badge Border Glow Layer */}
      {badgeKey && (
        <div className={`absolute inset-0 ${badgeFrameScale}`}>
          <CosmeticGraphic assetKey={badgeKey} showFrame={true} />
        </div>
      )}

      {/* Main Avatar Circle */}
      <div className={`${containerClass} bg-white rounded-full border-2 border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner z-10`}>
        {/* Base Character SVG */}
        <CosmeticGraphic assetKey="char_base" />

        {/* Costume/Outfit Overlay SVG */}
        {characterKey && characterKey !== 'char_base' && (
          <CosmeticGraphic assetKey={characterKey} isOverlay={true} />
        )}
      </div>

      {/* Tiny Badge Tag overlay at the bottom right */}
      {badgeKey && (
        <div className={`absolute ${badgeOverlayPos} bg-white border border-slate-200 shadow-sm p-0.5 rounded-full z-20`}>
          <div className={badgeOverlaySize}>
            <CosmeticGraphic assetKey={badgeKey} />
          </div>
        </div>
      )}
    </div>
  );
};
