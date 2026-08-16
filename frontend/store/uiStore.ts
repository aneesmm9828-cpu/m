import { create } from 'zustand';

export type PopupType = 'upload' | 'download' | 'success' | 'error' | 'info';

interface PopupState {
  isVisible: boolean;
  type: PopupType;
  message: string;
  progress: number; // 0 to 100
  showPopup: (type: PopupType, message: string, progress?: number) => void;
  updateProgress: (progress: number) => void;
  hidePopup: () => void;
}

export const useUIStore = create<PopupState>((set) => ({
  isVisible: false,
  type: 'info',
  message: '',
  progress: 0,

  showPopup: (type, message, progress = 0) => set({ isVisible: true, type, message, progress }),
  updateProgress: (progress) => set({ progress }),
  hidePopup: () => set({ isVisible: false, progress: 0 }),
}));
