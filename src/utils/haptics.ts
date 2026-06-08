import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Safe wrapper to prevent crashes when running in web browsers without Capacitor APIs
const isCapacitor = () => {
  return (window as any).Capacitor !== undefined;
};

export const triggerHapticClick = async () => {
  if (isCapacitor()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  } else {
    console.log('[Haptics Simulator] Light Click');
  }
};

export const triggerHapticMedium = async () => {
  if (isCapacitor()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  } else {
    console.log('[Haptics Simulator] Medium Click (Purchase)');
  }
};

export const triggerHapticSuccess = async () => {
  if (isCapacitor()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  } else {
    console.log('[Haptics Simulator] Success Notification');
  }
};

export const triggerHapticError = async () => {
  if (isCapacitor()) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  } else {
    console.log('[Haptics Simulator] Error Notification');
  }
};

export const triggerHapticSelection = async () => {
  if (isCapacitor()) {
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  } else {
    console.log('[Haptics Simulator] Selection Changed');
  }
};
