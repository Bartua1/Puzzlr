import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShop } from '../hooks/useShop';
import type { Cosmetic } from '../hooks/useShop';
import { triggerHapticClick, triggerHapticMedium, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Sparkles, Check, ArrowLeft, RefreshCw, Trophy, ShieldCheck, Zap, Trash2 } from 'lucide-react';

import coinX3 from '../assets/coin_x3.svg';
import streakProtector from '../assets/streak_protector.svg';

import { AvatarViewer, CosmeticGraphic } from '../components/AvatarViewer';

export const Shop = () => {
  const { profile } = useAuth();
  const { cosmetics, unlockedIds, loading, buyCosmetic, buyStreakProtector, equipCosmetic, adminBuyCosmetic, adminResetInventory } = useShop();
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

  const handleAdminPurchase = async (cosmetic: Cosmetic) => {
    await triggerHapticMedium();
    const res = await adminBuyCosmetic(cosmetic.id);
    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
      alert(res.message);
    }
  };

  const handleAdminResetInventory = async () => {
    await triggerHapticMedium();
    const res = await adminResetInventory();
    if (res.success) {
      await triggerHapticSuccess();
      // Reset preview back to base
      setPreviewCharacter('char_base');
      setPreviewBadge('');
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
        className={`group bg-surface-container-lowest rounded-3xl p-4 card-shadow inner-glow flex flex-col items-center justify-between relative cursor-pointer border transition-all duration-200 active:scale-95 ${
          isPreviewActive ? 'border-primary ring-1 ring-primary/20' : 'border-transparent'
        }`}
      >
        {/* Status chips / badge info */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] uppercase font-bold text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
            {t(`shop.types.${cos.type}`)}
          </span>
        </div>

        {owned && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" />
              {t('shop.owned')}
            </span>
          </div>
        )}

        {/* Visual Preview Area */}
        <div className="w-full aspect-square flex items-center justify-center relative mt-4 mb-2 overflow-hidden rounded-2xl bg-surface-container-low">
          <div className="w-16 h-16 relative transition-transform duration-300 group-hover:scale-110">
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

          {/* Selection/Preview active indicator */}
          {isPreviewActive && (
            <div className="absolute bottom-1 right-1">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Info + Action */}
        <div className="w-full text-center space-y-2">
          <div>
            <h4 className="text-body-md font-body-md font-bold text-on-background line-clamp-1">
              {cos.name}
            </h4>
          </div>

          {equipped ? (
            <button
              disabled
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-surface-container-high text-on-secondary-container text-label-bold font-label-bold py-2 rounded-xl flex items-center justify-center gap-1.5 uppercase cursor-default"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('shop.equipped')}
            </button>
          ) : owned ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEquip(cos);
              }}
              className="w-full bg-primary-container text-on-primary-container text-label-bold font-label-bold py-2 rounded-xl squishy-btn flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              {t('shop.equip')}
            </button>
          ) : profile?.is_admin ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdminPurchase(cos);
              }}
              className="w-full bg-emerald-500 text-white text-label-bold font-label-bold py-2 rounded-xl squishy-btn flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('shop.adminFree', 'FREE (ADMIN)').toUpperCase()}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(cos);
              }}
              disabled={(profile?.spendable_points || 0) < cos.price}
              className="w-full bg-surface-container text-secondary text-label-bold font-label-bold py-2 rounded-xl squishy-btn flex items-center justify-center gap-1.5 uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain select-none" />
              {t('shop.buyCoins', { price: cos.price }).toUpperCase()}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-surface-container to-background text-on-background font-body-md pb-24 pt-safe pb-safe">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-margin-mobile h-16 bg-surface dark:bg-background text-on-surface dark:text-on-background z-40 sticky top-0 border-b border-surface-container-highest">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="p-1 text-primary hover:opacity-80 transition-transform duration-150 active:scale-95 flex items-center justify-center rounded-full hover:bg-surface-container-high cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-headline-sm font-headline-sm font-bold uppercase tracking-wider">
            {t('shop.title', 'Tienda de Cosméticos').toUpperCase()}
          </h1>
        </div>
        <div className="flex items-center bg-surface-container-high rounded-full px-3 py-1.5 shadow-sm inner-glow">
          <img src={coinX3} alt="Coins" className="w-5 h-5 mr-1 object-contain select-none" />
          <span className="text-label-bold font-label-bold text-on-surface-variant tabular-nums">
            {profile?.spendable_points || 0}
          </span>
        </div>
      </header>

      <main className="px-margin-mobile max-w-md mx-auto pt-6 flex flex-col gap-6 w-full">
        {/* Avatar Preview Card */}
        {profile && (
          <section className="bg-surface-container-lowest rounded-3xl p-6 card-shadow flex flex-col items-center inner-glow relative w-full">
            {/* Reset button at top-right of the card */}
            <button
              onClick={resetPreviews}
              className="absolute top-4 right-4 w-8 h-8 bg-white border border-slate-200/80 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-90 z-30 cursor-pointer"
              title="Revert Preview"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <div className="relative">
              <div className="w-36 h-36 flex items-center justify-center mb-4 relative z-10">
                <AvatarViewer
                  characterKey={previewCharacter}
                  badgeKey={previewBadge}
                />
              </div>
            </div>

            <h2 className="text-headline-md font-headline-md text-on-background mb-1">
              {profile.username}
            </h2>

            <div className="flex items-center text-primary mb-6">
              <Sparkles className="w-4 h-4 mr-1" />
              <span className="text-label-sm font-label-sm">
                {t('shop.previewSubtitle', 'Toca los artículos abajo para probarlos aquí')}
              </span>
            </div>

            <div className="flex w-full gap-4 pt-4 border-t border-surface-container-highest">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-secondary mb-1">
                  {t('shop.spendable', 'Spendable').toUpperCase()}
                </span>
                <div className="flex items-center">
                  <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain mr-1 select-none" />
                  <span className="text-label-bold font-label-bold text-tertiary-container tabular-nums">
                    {profile.spendable_points}
                  </span>
                </div>
              </div>
              <div className="w-[1px] bg-surface-container-highest"></div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-secondary mb-1">
                  {t('shop.lifetime', 'Lifetime').toUpperCase()}
                </span>
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 text-primary mr-1" />
                  <span className="text-label-bold font-label-bold text-primary tabular-nums">
                    {profile.lifetime_points}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <nav className="flex bg-surface-container-low rounded-full p-1 overflow-x-auto no-scrollbar shadow-sm border border-surface-container-highest w-full">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                triggerHapticClick();
                setSelectedCategory(cat.key);
              }}
              className={`flex-1 px-4 py-2 rounded-full text-label-bold font-label-bold whitespace-nowrap transition-colors cursor-pointer text-center ${
                selectedCategory === cat.key
                  ? 'bg-white text-on-surface shadow-sm'
                  : 'text-secondary hover:bg-surface-container'
              }`}
            >
              {cat.label.toUpperCase()}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 w-full">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
              {t('shop.loadingItems')}
            </p>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {/* Power-ups Section */}
            {selectedCategory === 'all' && (
              <section className="w-full">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-4 bg-tertiary-fixed-dim rounded-full mr-2"></div>
                  <h3 className="text-label-bold font-label-bold text-secondary uppercase tracking-widest">
                    {t('shop.sections.utilities', 'Power-Ups & Utilities').toUpperCase()}
                  </h3>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-4 card-shadow inner-glow flex flex-col gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-tertiary-fixed/20 rounded-2xl flex items-center justify-center border border-tertiary-fixed flex-shrink-0">
                      <img
                        src={streakProtector}
                        alt="Streak Protector"
                        className="w-10 h-10 object-contain select-none"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-body-md font-body-md font-bold text-on-background">
                          {t('shop.streakProtectorName', 'Streak Protector')}
                        </h4>
                        <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          {t('shop.streakProtectorType', 'Utility').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-label-sm font-label-sm text-secondary mb-1">
                        {t('shop.streakProtectorDesc', 'Keeps your streak alive if you miss a daily game! Used automatically.')}
                      </p>
                      <p className="text-label-bold font-label-bold text-tertiary-container text-[11px] tabular-nums">
                        {t('shop.ownedCount', { count: profile?.streak_protectors || 0 })}
                      </p>
                    </div>
                  </div>
                  {profile?.is_admin ? (
                    <button
                      onClick={handleBuyStreakProtector}
                      className="w-full bg-emerald-500 text-white text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('shop.adminFree', 'FREE (ADMIN)').toUpperCase()}
                    </button>
                  ) : (
                    <button
                      onClick={handleBuyStreakProtector}
                      disabled={(profile?.spendable_points || 0) < 150}
                      className="w-full bg-surface-container text-secondary text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 border-b-2 border-surface-container-highest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain select-none" />
                      {t('shop.buyCoins', { price: 150 }).toUpperCase()}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Badges Section */}
            {(selectedCategory === 'all' || selectedCategory === 'badge') && badgesList.length > 0 && (
              <section className="w-full">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-4 bg-tertiary-fixed-dim rounded-full mr-2"></div>
                  <h3 className="text-label-bold font-label-bold text-secondary uppercase tracking-widest">
                    {t('shop.sections.badges', 'Badges').toUpperCase()}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {badgesList.map((cos) => renderItemCard(cos, 'badge'))}
                </div>
              </section>
            )}

            {/* Outfits & Costumes Section */}
            {(selectedCategory === 'all' || selectedCategory === 'costume') && outfitsList.length > 0 && (
              <section className="w-full">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-4 bg-tertiary-fixed-dim rounded-full mr-2"></div>
                  <h3 className="text-label-bold font-label-bold text-secondary uppercase tracking-widest">
                    {t('shop.sections.outfits', 'Outfits & Costumes').toUpperCase()}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {outfitsList.map((cos) => renderItemCard(cos, 'costume'))}
                </div>
              </section>
            )}

            {/* Admin Tools Section */}
            {profile?.is_admin && (
              <section className="w-full">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-4 bg-error rounded-full mr-2"></div>
                  <h3 className="text-label-bold font-label-bold text-error uppercase tracking-widest">
                    {t('shop.adminSection', 'Admin Tools').toUpperCase()}
                  </h3>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-5 card-shadow inner-glow flex flex-col gap-4 w-full border border-error/20">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-error flex-shrink-0" />
                    <div>
                      <h4 className="text-body-md font-body-md font-bold text-on-background">
                        {t('shop.adminResetTitle', 'Reset Inventory')}
                      </h4>
                      <p className="text-label-sm font-label-sm text-secondary">
                        {t('shop.adminResetDesc', 'Delete all owned cosmetics and unequip everything. Default avatar will be re-granted.')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAdminResetInventory}
                    className="w-full bg-error text-on-error text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 uppercase cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('shop.adminResetInventory', 'Reset All Inventory').toUpperCase()}
                  </button>
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
