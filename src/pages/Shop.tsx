import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShop } from '../hooks/useShop';
import type { Cosmetic } from '../hooks/useShop';
import { triggerHapticClick, triggerHapticMedium, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Sparkles, Check, ArrowLeft, RefreshCw, Trophy, ShieldCheck, Zap } from 'lucide-react';

import coinX3 from '../assets/coin_x3.svg';
import streakProtector from '../assets/streak_protector.svg';

import { AvatarViewer, CosmeticGraphic } from '../components/AvatarViewer';

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

  const categories = [
    { key: 'all' as const, label: t('shop.allItems', 'All Items') },
    { key: 'costume' as const, label: `${t('shop.types.costume')} & ${t('shop.types.character')}` },
    { key: 'badge' as const, label: t('shop.types.badge') },
  ];

  // Render a single shop item card
  const renderItemCard = (cos: Cosmetic, type: 'badge' | 'costume') => {
    const owned = unlockedIds.includes(cos.id);
    const equipped = getEquippedId(type) === cos.id;
    const isPreviewActive = type === 'badge'
      ? previewBadge === cos.asset_key
      : previewCharacter === cos.asset_key;

    return (
      <div
        key={cos.id}
        onClick={() => {
          triggerHapticClick();
          if (type === 'badge') {
            setPreviewBadge(cos.asset_key);
          } else {
            setPreviewCharacter(cos.asset_key);
          }
        }}
        className={`group relative bg-white/70 backdrop-blur-sm rounded-[28px] border overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.97] ${
          isPreviewActive
            ? 'border-indigo-300 shadow-lg shadow-indigo-100/60 ring-1 ring-indigo-200/40'
            : 'border-white/60 shadow-md hover:shadow-lg hover:border-slate-200'
        }`}
      >
        {/* Status chips */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className="text-[8px] font-black uppercase tracking-wider bg-white/80 backdrop-blur-sm text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100/50">
            {t(`shop.types.${cos.type}`)}
          </span>
        </div>
        {owned && (
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50/90 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-emerald-100/50">
              <Check className="w-3 h-3" /> {t('shop.owned')}
            </span>
          </div>
        )}

        {/* Visual Preview Area */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-slate-50/80 via-white to-slate-50/60 flex items-center justify-center p-6 overflow-hidden">
          {/* Decorative bg elements */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-[6px] border-slate-800" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-[4px] border-slate-800" />
          </div>

          <div className="w-20 h-20 relative transition-transform duration-300 group-hover:scale-110">
            {type === 'costume' && cos.asset_key !== 'char_base' ? (
              <>
                <div className="absolute inset-0 opacity-15">
                  <CosmeticGraphic assetKey="char_base" />
                </div>
                <div className="absolute inset-0">
                  <CosmeticGraphic assetKey={cos.asset_key} isOverlay={true} />
                </div>
              </>
            ) : (
              <CosmeticGraphic assetKey={cos.asset_key} />
            )}
          </div>

          {/* Selection indicator */}
          {isPreviewActive && (
            <div className="absolute bottom-2 right-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Info + Action */}
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
              {cos.name}
            </h4>
            <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
              {cos.asset_key.replace(/cos_|char_|badge_/g, '').replace(/_/g, ' ')}
            </p>
          </div>

          {equipped ? (
            <button
              disabled
              className="w-full py-2.5 bg-slate-100/80 text-slate-400 text-[11px] font-black rounded-2xl cursor-default flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {t('shop.equipped')}
            </button>
          ) : owned ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEquip(cos);
              }}
              className="w-full py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-black rounded-2xl cursor-pointer transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 uppercase tracking-wider border border-indigo-100/50"
            >
              <Zap className="w-3.5 h-3.5" /> {t('shop.equip')}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(cos);
              }}
              disabled={(profile?.spendable_points || 0) < cos.price}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white text-[11px] font-black rounded-2xl cursor-pointer transition-all active:scale-[0.97] shadow-sm disabled:shadow-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain select-none" /> {t('shop.buy', { price: cos.price })}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-safe pb-safe">

      {/* Sticky header — matches GroupDetails style */}
      <header className="sticky top-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/95 via-violet-100/80 to-transparent backdrop-blur-[2px]" />

        <div className="relative pointer-events-auto flex items-center justify-between px-6 py-4" style={{ minHeight: '64px' }}>
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <span className="text-sm font-black tracking-tight text-slate-800 uppercase">
            {t('shop.title', 'Shop')}
          </span>

          {/* Balance pill */}
          <div className="flex items-center gap-1.5 bg-white/60 border border-white/50 px-3 py-1.5 rounded-full shadow-sm">
            <img src={coinX3} alt="Coins" className="w-5 h-5 object-contain select-none" />
            <span className="text-xs font-black text-slate-800 tabular-nums">{profile?.spendable_points || 0}</span>
          </div>
        </div>

        {/* Gradient tail fade */}
        <div className="h-4 bg-gradient-to-b from-violet-100/30 to-transparent" />
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-5 pt-2 pb-12 space-y-6">

        {/* PROFILE SUMMARY + PREVIEW */}
        {profile && (
          <div className="relative bg-white/60 backdrop-blur-md rounded-[32px] border border-white/50 shadow-xl overflow-hidden">
            {/* Decorative gradients */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-sky-400/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 flex flex-col items-center gap-5">
              {/* Equipped Avatar Preview Playground */}
              <div className="relative">
                <div className="w-28 h-28 relative">
                  <AvatarViewer
                    characterKey={previewCharacter}
                    badgeKey={previewBadge}
                  />
                </div>

                {/* Reset button overlaid on avatar */}
                <button
                  onClick={resetPreviews}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-slate-200/80 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-90 z-10"
                  title="Revert Preview"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* User info */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{profile.username}</h1>
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold text-slate-400">{t('shop.previewSubtitle')}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-0 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100/60 overflow-hidden w-full max-w-xs">
                <div className="flex-1 text-center py-3 px-4">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Spendable</span>
                  <span className="text-base font-black text-amber-600 flex items-center justify-center gap-1">
                    <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain translate-y-[2px] select-none" /> {profile.spendable_points}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200/60" />
                <div className="flex-1 text-center py-3 px-4">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Lifetime</span>
                  <span className="text-base font-black text-indigo-600 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {profile.lifetime_points}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY TABS — pill style */}
        <div className="flex gap-1.5 bg-white/40 backdrop-blur-sm p-1 rounded-2xl border border-white/50 shadow-sm">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => { triggerHapticClick(); setSelectedCategory(cat.key); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                selectedCategory === cat.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">{t('shop.loadingItems')}</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* UTILITIES SECTION */}
            {selectedCategory === 'all' && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 pl-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                  Power-Ups & Utilities
                </h3>

                <div
                  className="group relative bg-white/70 backdrop-blur-sm rounded-[28px] border border-white/60 shadow-md overflow-hidden transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 p-5">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={streakProtector}
                        alt="Streak Protector"
                        className="w-10 h-10 object-contain select-none"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Streak Protector</h4>
                        <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100/80 text-amber-700 px-1.5 py-0.5 rounded-md">
                          Utility
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        Keeps your streak alive if you miss a daily game! Used automatically.
                      </p>
                      <span className="text-[9px] font-black text-amber-700 mt-1 inline-block">
                        Owned: {profile?.streak_protectors || 0}
                      </span>
                    </div>
                  </div>

                  {/* Buy action */}
                  <div className="px-5 pb-4">
                    <button
                      onClick={handleBuyStreakProtector}
                      disabled={(profile?.spendable_points || 0) < 150}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white text-[11px] font-black rounded-2xl cursor-pointer transition-all active:scale-[0.97] shadow-sm disabled:shadow-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain select-none" /> Buy for 150 Coins
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* BADGES SECTION */}
            {(selectedCategory === 'all' || selectedCategory === 'badge') && badgesList.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 pl-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                  {t('shop.types.badge')}s
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {badgesList.map((cos) => renderItemCard(cos, 'badge'))}
                </div>
              </section>
            )}

            {/* OUTFITS & CHARACTERS SECTION */}
            {(selectedCategory === 'all' || selectedCategory === 'costume') && outfitsList.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 pl-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-sky-400 to-emerald-500 rounded-full" />
                  Outfits & Costumes
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {outfitsList.map((cos) => renderItemCard(cos, 'costume'))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>

      <DisclaimerFooter />
    </div>
  );
};
