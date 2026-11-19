/**
 * BDTRAC — global UI state (Zustand, Part 1 foundation).
 *
 * Owns only ephemeral interface state (which overlay is open). Server data
 * (catalog, settings, orders) is NOT stored here — it flows from the server
 * via the existing storefront providers in src/lib. One overlay at a time:
 * opening one closes the others.
 */
import { create } from "zustand";

export type OverlayKind = "search" | "menu" | "cart" | null;

interface UiState {
  readonly overlay: OverlayKind;
  openOverlay: (kind: Exclude<OverlayKind, null>) => void;
  closeOverlay: () => void;
  toggleOverlay: (kind: Exclude<OverlayKind, null>) => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  overlay: null,
  openOverlay: (kind) => set({ overlay: kind }),
  closeOverlay: () => set({ overlay: null }),
  toggleOverlay: (kind) =>
    set({ overlay: get().overlay === kind ? null : kind }),
}));
