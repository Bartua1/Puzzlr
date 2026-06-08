import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShop } from '../hooks/useShop';
import type { Cosmetic } from '../hooks/useShop';
import { triggerHapticClick, triggerHapticMedium, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Sparkles, Check, ArrowLeft, RefreshCw, Trophy, User } from 'lucide-react';

import coinX3 from '../assets/coin_x3.svg';
import streakProtector from '../assets/streak_protector.svg';

// --- CUSTOM SVG ASSET RENDERERS ---

// 1. Character Base Render
const CharacterBaseSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Body/Head base */}
    <circle cx="50" cy="52" r="32" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    {/* Blushing cheeks */}
    <circle cx="34" cy="58" r="5" fill="#FCA5A5" opacity="0.6" />
    {/* Blushing cheeks */}
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

// Unified renderer helper
const CosmeticGraphic = ({ assetKey, isOverlay = false, showFrame = false }: { assetKey: string; isOverlay?: boolean; showFrame?: boolean }) => {
  if (assetKey === 'cos_knight') return <KnightHelmetSVG isOverlay={isOverlay} />;
  if (assetKey === 'cos_wizard') return <WizardSVG isOverlay={isOverlay} />;
  if (assetKey === 'badge_gold') return <GoldBadgeSVG showFrame={showFrame} />;
  if (assetKey === 'badge_silver') return <SilverBadgeSVG showFrame={showFrame} />;
  return <CharacterBaseSVG />;
};

// Premium Character Preview Box
interface AvatarViewerProps {
  characterKey: string;
  badgeKey: string;
  size?: 'sm' | 'lg';
}

const AvatarViewer = ({ characterKey, badgeKey, size = 'lg' }: AvatarViewerProps) => {
  const containerClass = size === 'lg' ? 'w-36 h-36' : 'w-16 h-16';
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Badge Border Glow Layer */}
      {badgeKey && (
        <div className={`absolute inset-0 ${size === 'lg' ? 'scale-110' : 'scale-105'}`}>
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
        <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 shadow-sm p-1 rounded-full z-20">
          <div className="w-5 h-5">
            <CosmeticGraphic assetKey={badgeKey} />
          </div>
        </div>
      )}
    </div>
  );
};

export const Shop = () => {
  const { profile } = useAuth();
  const { cosmetics, unlockedIds, loading, buyCosmetic, buyStreakProtector, equipCosmetic } = useShop();
  const { t } = useTranslation();

  // Selected item filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'costume' | 'badge'>('all');

  // Preview state
  const [previewCharacter, setPreviewCharacter] = useState<string>('char_base');
  const [previewBadge, setPreviewBadge] = useState<string>('');
  
  // Update previews when profile changes
  useEffect(() => {
    if (profile) {
      const activeChar = cosmetics.find((c) => c.id === profile.equipped_character_id);
      const activeBadge = cosmetics.find((c) => c.id === profile.equipped_badge_id);
      
      setPreviewCharacter(activeChar?.asset_key || 'char_base');
      setPreviewBadge(activeBadge?.asset_key || '');
    }
  }, [cosmetics, profile]);

  const handlePurchase = async (cosmetic: Cosmetic) => {
    await triggerHapticMedium();
    const res = await buyCosmetic(cosmetic.id);
    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
      alert(res.message);
    }
  };

  const handleBuyStreakProtector = async () => {
    await triggerHapticMedium();
    const res = await buyStreakProtector();
    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
      alert(res.message);
    }
  };

  const handleEquip = async (cosmetic: Cosmetic) => {
    await triggerHapticClick();
    const res = await equipCosmetic(cosmetic.id, cosmetic.type);
    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
    }
  };

  const getEquippedId = (type: 'badge' | 'costume' | 'character') => {
    if (type === 'badge') return profile?.equipped_badge_id;
    return profile?.equipped_character_id;
  };

  // Grouped Inventory
  const badgesList = cosmetics.filter(c => c.type === 'badge');
  const outfitsList = cosmetics.filter(c => c.type === 'costume' || c.type === 'character');

  // Reset previews back to profile active
  const resetPreviews = () => {
    triggerHapticClick();
    const activeChar = cosmetics.find((c) => c.id === profile?.equipped_character_id);
    const activeBadge = cosmetics.find((c) => c.id === profile?.equipped_badge_id);
    setPreviewCharacter(activeChar?.asset_key || 'char_base');
    setPreviewBadge(activeBadge?.asset_key || '');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 pt-[safe] pb-[safe] transition-all duration-300">
      <div className="max-w-4xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Navigation header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/80 shadow-sm flex items-center justify-center transition-all text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('settings.backToDashboard')}</span>
        </div>

        {/* 1. PREMIUM USER PROFILE VIEW */}
        {profile && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100/50 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between transition-all duration-300">
            <div className="flex items-center gap-5">
            <AvatarViewer
              characterKey={cosmetics.find(c => c.id === profile.equipped_character_id)?.asset_key || 'char_base'}
              badgeKey={cosmetics.find(c => c.id === profile.equipped_badge_id)?.asset_key || ''}
              size="sm"
            />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">{profile.username}</h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {cosmetics.find(c => c.id === profile.equipped_badge_id)?.name || 'Default Player'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Account Profile
                </p>
              </div>
            </div>

            {/* Profile statistics */}
            <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/30 w-full md:w-auto justify-around">
              <div className="text-center px-4">
                <span className="text-xs text-slate-400 font-bold block mb-0.5">Spendable</span>
                <span className="text-lg font-black text-amber-600 flex items-center justify-center gap-1.5">
                  <img src={coinX3} alt="Coins" className="w-5 h-5 object-contain translate-y-[4px] select-none" /> {profile.spendable_points}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center px-4">
                <span className="text-xs text-slate-400 font-bold block mb-0.5">Lifetime</span>
                <span className="text-lg font-black text-indigo-600 flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" /> {profile.lifetime_points}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. PLAYGROUND PREVIEW CARD */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-5 h-5 text-indigo-500" /> {t('shop.previewTitle')}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1 max-w-sm">
              {t('shop.previewSubtitle')}
            </p>
            
            {/* Action panel to reset preview */}
            <button
              onClick={resetPreviews}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm border border-slate-200/50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Revert Preview
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-center w-48 h-48 relative">
            <AvatarViewer
              characterKey={previewCharacter}
              badgeKey={previewBadge}
            />
          </div>
        </div>

        {/* CATEGORY SWITCHER */}
        <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => { triggerHapticClick(); setSelectedCategory('all'); }}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              selectedCategory === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => { triggerHapticClick(); setSelectedCategory('costume'); }}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              selectedCategory === 'costume' ? 'text-indigo-600 border-b-2 border-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('shop.types.costume')} & {t('shop.types.character')}
          </button>
          <button
            onClick={() => { triggerHapticClick(); setSelectedCategory('badge'); }}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              selectedCategory === 'badge' ? 'text-indigo-600 border-b-2 border-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('shop.types.badge')}
          </button>
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-400 text-sm font-semibold">{t('shop.loadingItems')}</p>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* UTILITIES SECTION */}
            {selectedCategory === 'all' && (
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                  Power-Ups & Utilities
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div
                    className="p-5 bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-3xl border border-amber-100/80 transition-all relative flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                          Utility
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-white/95 px-2 py-0.5 rounded-lg border border-amber-100/50 shadow-inner">
                          Owned: {profile?.streak_protectors || 0}
                        </span>
                      </div>

                      {/* Visual representations */}
                      <div className="w-full h-24 bg-slate-50/50 border border-slate-100 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                        <img 
                          src={streakProtector} 
                          alt="Streak Protector" 
                          className="w-14 h-14 object-contain select-none" 
                        />
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                        Streak Protector
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold tracking-wide leading-relaxed">
                        Keeps your streak alive if you miss a daily game! Used automatically.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={handleBuyStreakProtector}
                        disabled={(profile?.spendable_points || 0) < 150}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-sm active:scale-[0.98]"
                      >
                        Buy for 150 Coins
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3A. BADGES SECTION */}
            {(selectedCategory === 'all' || selectedCategory === 'badge') && (
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                  {t('shop.types.badge')}s
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {badgesList.map((cos) => {
                    const owned = unlockedIds.includes(cos.id);
                    const equipped = getEquippedId('badge') === cos.id;

                    return (
                      <div
                        key={cos.id}
                        onClick={() => {
                          triggerHapticClick();
                          setPreviewBadge(cos.asset_key);
                        }}
                        className={`p-5 bg-white rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between group shadow-sm hover:shadow-md ${
                          previewBadge === cos.asset_key ? 'border-indigo-400 ring-2 ring-indigo-100/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Upper Section */}
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">
                              {t(`shop.types.${cos.type}`)}
                            </span>
                            {owned && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> {t('shop.owned')}
                              </span>
                            )}
                          </div>

                          {/* Graphical Visual of Badge */}
                          <div className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                            <div className="w-14 h-14">
                              <CosmeticGraphic assetKey={cos.asset_key} />
                            </div>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                            {cos.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                            {cos.asset_key.replace('_', ' ')}
                          </p>
                        </div>

                        {/* Button Action */}
                        <div className="mt-4 pt-3 border-t border-slate-50">
                          {equipped ? (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-black rounded-xl cursor-default"
                            >
                              {t('shop.equipped')}
                            </button>
                          ) : owned ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquip(cos);
                              }}
                              className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              {t('shop.equip')}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchase(cos);
                              }}
                              disabled={(profile?.spendable_points || 0) < cos.price}
                              className="w-full py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              {t('shop.buy', { price: cos.price })}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3B. OUTIFTS & CHARACTERS SECTION */}
            {(selectedCategory === 'all' || selectedCategory === 'costume') && (
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                  Outfits & Costumes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {outfitsList.map((cos) => {
                    const owned = unlockedIds.includes(cos.id);
                    const equipped = getEquippedId('costume') === cos.id;

                    return (
                      <div
                        key={cos.id}
                        onClick={() => {
                          triggerHapticClick();
                          setPreviewCharacter(cos.asset_key);
                        }}
                        className={`p-5 bg-white rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between group shadow-sm hover:shadow-md ${
                          previewCharacter === cos.asset_key ? 'border-indigo-400 ring-2 ring-indigo-100/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Upper Section */}
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">
                              {t(`shop.types.${cos.type}`)}
                            </span>
                            {owned && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> {t('shop.owned')}
                              </span>
                            )}
                          </div>

                          {/* Graphical Visual of Character/Costume */}
                          <div className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                            {cos.asset_key === 'char_base' ? (
                              <div className="w-14 h-14">
                                <CosmeticGraphic assetKey="char_base" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 relative flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20">
                                  <CosmeticGraphic assetKey="char_base" />
                                </div>
                                <div className="absolute inset-0">
                                  <CosmeticGraphic assetKey={cos.asset_key} isOverlay={true} />
                                </div>
                              </div>
                            )}
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                            {cos.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                            {cos.asset_key.replace('cos_', '').replace('char_', '').replace('_', ' ')}
                          </p>
                        </div>

                        {/* Button Action */}
                        <div className="mt-4 pt-3 border-t border-slate-50">
                          {equipped ? (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-black rounded-xl cursor-default"
                            >
                              {t('shop.equipped')}
                            </button>
                          ) : owned ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquip(cos);
                              }}
                              className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              {t('shop.equip')}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchase(cos);
                              }}
                              disabled={(profile?.spendable_points || 0) < cos.price}
                              className="w-full py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              {t('shop.buy', { price: cos.price })}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
      <DisclaimerFooter />
    </div>
  );
};
