import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShop } from '../hooks/useShop';
import type { Cosmetic } from '../hooks/useShop';
import { triggerHapticClick, triggerHapticMedium, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Sparkles, Check, ArrowLeft, RefreshCw, Trophy, ShieldCheck, Zap, Trash2, X } from 'lucide-react';

import coinX3 from '../assets/coin_x3.svg';
import streakProtector from '../assets/streak_protector.svg';

import { AvatarViewer, CosmeticGraphic } from '../components/AvatarViewer';

export const Shop = () => {
  const { profile } = useAuth();
  const { cosmetics, unlockedIds, loading, buyCosmetic, buyStreakProtector, equipCosmetic, adminBuyCosmetic, adminResetInventory } = useShop();
  const { t } = useTranslation();

  // Selected item filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'badge'>('all');

  // Preview state
  const [previewBadge, setPreviewBadge] = useState<string>('');
  
  // Selected item for the details modal
  const [selectedItem, setSelectedItem] = useState<Cosmetic | null>(null);
  const [animateShow, setAnimateShow] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  // Monitor device layout/orientation for modal positioning
  useEffect(() => {
    const checkLayout = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Animate the showing of the details drawer
  useEffect(() => {
    if (selectedItem) {
      const timer = setTimeout(() => setAnimateShow(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateShow(false);
    }
  }, [selectedItem]);

  // Update previews when profile changes
  useEffect(() => {
    if (profile) {
      const activeBadge = cosmetics.find((c) => c.id === profile.equipped_badge_id);
      setPreviewBadge(activeBadge?.asset_key || '');
    }
  }, [cosmetics, profile]);

  const handlePurchase = async (cosmetic: Cosmetic) => {
    await triggerHapticMedium();
    const res = await buyCosmetic(cosmetic.id);
    if (res.success) {
      await triggerHapticSuccess();
      // Keep it selected to update status in modal
      setSelectedItem(cosmetic);
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
      setSelectedItem(cosmetic);
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
      setPreviewBadge('');
      setSelectedItem(null);
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

  const handleUnequip = async (type: 'character' | 'badge' | 'costume') => {
    await triggerHapticClick();
    const res = await equipCosmetic(null, type);
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

  // Reset previews back to profile active
  const resetPreviews = () => {
    triggerHapticClick();
    const activeBadge = cosmetics.find((c) => c.id === profile?.equipped_badge_id);
    setPreviewBadge(activeBadge?.asset_key || '');
  };

  const categories = [
    { key: 'all' as const, label: t('shop.allItems', 'All Items') },
    { key: 'badge' as const, label: t('shop.types.badge') },
  ];

  const handleCloseModal = () => {
    setAnimateShow(false);
    setTimeout(() => {
      setSelectedItem(null);
      resetPreviews();
    }, 200);
  };

  // Render a clean square box for a cosmetic item
  const renderItemBox = (cos: Cosmetic) => {
    const owned = unlockedIds.includes(cos.id);
    const equipped = getEquippedId('badge') === cos.id;
    const isSelected = selectedItem?.id === cos.id;

    return (
      <button
        key={cos.id}
        onClick={() => {
          triggerHapticClick();
          setSelectedItem(cos);
          setPreviewBadge(cos.asset_key);
        }}
        className={`aspect-square w-full rounded-2xl p-2 bg-surface-container-lowest border transition-all duration-200 flex flex-col items-center justify-center relative active:scale-95 cursor-pointer shadow-sm hover:shadow ${
          isSelected 
            ? 'border-primary ring-2 ring-primary/20 scale-95' 
            : equipped 
              ? 'border-primary bg-primary-container/20' 
              : owned 
                ? 'border-emerald-200 bg-emerald-50/20' 
                : 'border-surface-container-highest hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Status indicator in top right */}
        <div className="absolute top-1.5 right-1.5 z-10">
          {equipped ? (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          ) : owned ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : null}
        </div>

        {/* Visual Preview Area */}
        <div className="w-12 h-12 flex items-center justify-center relative overflow-hidden rounded-xl bg-surface-container-low p-1 mb-1">
          <div className="w-10 h-10 relative">
            <CosmeticGraphic assetKey={cos.asset_key} />
          </div>
        </div>

        {/* Short Item Label */}
        <span className="text-[10px] font-bold text-on-background line-clamp-1 mt-0.5 text-center w-full px-0.5">
          {cos.name}
        </span>
      </button>
    );
  };

  // Render a clean square box for the Streak Protector utility
  const renderStreakProtectorBox = () => {
    const isSelected = selectedItem?.id === 'streak_protector';
    const ownedCount = profile?.streak_protectors || 0;
    const fakeCosmetic: Cosmetic = {
      id: 'streak_protector',
      name: t('shop.streakProtectorName', 'Streak Protector'),
      type: 'character', // dummy mapping
      price: 150,
      asset_key: 'streak_protector',
      is_active: true
    };

    return (
      <button
        onClick={() => {
          triggerHapticClick();
          setSelectedItem(fakeCosmetic);
        }}
        className={`aspect-square w-full rounded-2xl p-2 bg-surface-container-lowest border transition-all duration-200 flex flex-col items-center justify-center relative active:scale-95 cursor-pointer shadow-sm hover:shadow ${
          isSelected 
            ? 'border-primary ring-2 ring-primary/20 scale-95' 
            : ownedCount > 0
              ? 'border-amber-200 bg-amber-50/20'
              : 'border-surface-container-highest hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Status count indicator in top right */}
        {ownedCount > 0 && (
          <div className="absolute top-1.5 right-1.5 z-10 bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
            x{ownedCount}
          </div>
        )}

        {/* Visual Preview Area */}
        <div className="w-12 h-12 flex items-center justify-center relative overflow-hidden rounded-xl bg-surface-container-low p-2.5 mb-1">
          <img
            src={streakProtector}
            alt="Streak Protector"
            className="w-8 h-8 object-contain select-none"
          />
        </div>

        {/* Short Item Label */}
        <span className="text-[10px] font-bold text-on-background line-clamp-1 mt-0.5 text-center w-full px-0.5">
          {t('shop.streakProtectorName', 'Streak Protector')}
        </span>
      </button>
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
                  avatarUrl={profile.avatar_url}
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
                <div className="grid grid-cols-4 gap-3 w-full">
                  {renderStreakProtectorBox()}
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
                <div className="grid grid-cols-4 gap-3 w-full">
                  {badgesList.map((cos) => renderItemBox(cos))}
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

      {/* Item Details Sliding Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto transition-opacity duration-200 ${
              animateShow ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleCloseModal}
          />
          
          {/* Slide-out Drawer Panel */}
          <div
            className={`w-full max-w-md bg-surface-container-lowest shadow-2xl border-surface-container-highest pointer-events-auto transition-all duration-200 transform z-10 flex flex-col ${
              isLandscape
                ? `top-0 rounded-b-3xl border-b pt-4 pb-6 px-6 ${
                    animateShow ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                  }`
                : `bottom-0 rounded-t-3xl border-t pt-6 pb-8 px-6 ${
                    animateShow ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                  }`
            }`}
            style={{ position: 'fixed' }}
          >
            {/* Grab handle for sheet aesthetics */}
            {!isLandscape && (
              <div 
                className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto mb-4 cursor-pointer"
                onClick={handleCloseModal}
              />
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary tracking-widest bg-surface-container-high px-2.5 py-0.5 rounded-full">
                  {selectedItem.id === 'streak_protector'
                    ? t('shop.streakProtectorType', 'Utility').toUpperCase()
                    : t(`shop.types.${selectedItem.type}`).toUpperCase()}
                </span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-background mt-1.5">
                  {selectedItem.name}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 text-secondary hover:text-on-background hover:bg-surface-container-high rounded-full transition-transform active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start my-2 flex-1">
              {/* Item Graphic Box */}
              <div className="w-28 h-28 bg-surface-container rounded-2xl flex items-center justify-center p-3 flex-shrink-0 border border-surface-container-highest shadow-inner">
                {selectedItem.id === 'streak_protector' ? (
                  <img
                    src={streakProtector}
                    alt="Streak Protector"
                    className="w-16 h-16 object-contain select-none"
                  />
                ) : (
                  <AvatarViewer
                    avatarUrl={profile?.avatar_url || null}
                    badgeKey={selectedItem.asset_key}
                    size="lg"
                  />
                )}
              </div>

              {/* Item Description + Pricing Info */}
              <div className="flex-1 text-center sm:text-left flex flex-col justify-between h-full gap-2">
                <p className="text-body-md font-body-md text-secondary">
                  {selectedItem.id === 'streak_protector'
                    ? t('shop.streakProtectorDesc')
                    : selectedItem.type === 'badge'
                      ? t('shop.badgeDesc')
                      : t('shop.outfitDesc')}
                </p>

                <div className="mt-2 flex items-center justify-center sm:justify-start gap-1 text-label-bold font-label-bold text-secondary">
                  {selectedItem.id === 'streak_protector' ? (
                    <span className="text-tertiary-container flex items-center gap-1.5">
                      {t('shop.ownedCount', { count: profile?.streak_protectors || 0 })}
                    </span>
                  ) : unlockedIds.includes(selectedItem.id) ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {t('shop.owned')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain" />
                      {t('shop.buyCoins', { price: selectedItem.price }).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Grab handle (for landscape top sheets) */}
            {isLandscape && (
              <div 
                className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto mt-4 mb-2 cursor-pointer"
                onClick={handleCloseModal}
              />
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              {selectedItem.id === 'streak_protector' ? (
                profile?.is_admin ? (
                  <button
                    onClick={handleBuyStreakProtector}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {t('shop.adminFree', 'FREE (ADMIN)').toUpperCase()}
                  </button>
                ) : (
                  <button
                    onClick={handleBuyStreakProtector}
                    disabled={(profile?.spendable_points || 0) < 150}
                    className="w-full bg-primary text-white hover:bg-primary/95 disabled:bg-surface-container disabled:text-secondary text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain select-none" />
                    {t('shop.buyCoins', { price: 150 }).toUpperCase()}
                  </button>
                )
              ) : unlockedIds.includes(selectedItem.id) ? (
                getEquippedId(selectedItem.type) === selectedItem.id ? (
                  <button
                    onClick={() => handleUnequip(selectedItem.type)}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors animate-fade-in"
                  >
                    <X className="w-4 h-4" />
                    {t('shop.unequip').toUpperCase()}
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(selectedItem)}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors animate-fade-in"
                  >
                    <Zap className="w-4 h-4" />
                    {t('shop.equip').toUpperCase()}
                  </button>
                )
              ) : profile?.is_admin ? (
                <button
                  onClick={() => handleAdminPurchase(selectedItem)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t('shop.adminFree', 'FREE (ADMIN)').toUpperCase()}
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={(profile?.spendable_points || 0) < selectedItem.price}
                  className="w-full bg-primary text-white hover:bg-primary/95 disabled:bg-surface-container disabled:text-secondary text-label-bold font-label-bold py-3 rounded-xl squishy-btn flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain" />
                  {t('shop.buyCoins', { price: selectedItem.price }).toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
