import {
  buildGuestStorageKey,
  getMaxGuestQuota,
  normalizeInvitationCategory,
  sanitizeGuestText
} from '../utils/rsvpContract.js';

/**
 * GameState - Central Observable State Manager
 */
export const PHASES = {
  COVER: 'COVER',
  AVATAR_CREATOR: 'AVATAR_CREATOR',
  OPENING_VIDEO: 'OPENING_VIDEO',
  EXPLORATION: 'EXPLORATION',
  MAIN_HALL: 'MAIN_HALL',
  ADJIE_PROTOTYPE: 'ADJIE_PROTOTYPE',
  MODAL: 'MODAL'
};

export const MODALS = {
  NONE: null,
  PROFILE: 'profile',
  GALLERY: 'gallery',
  LISTENING: 'listening',
  FOODCOURT: 'foodcourt',
  RSVP: 'rsvp',
  CLOSING_VIDEO: 'closing_video',
  LOCATION: 'location',
  GIFT: 'gift',
  WISHES: 'wishes'
};

class GameState {
  constructor() {
    this.listeners = new Set();
    const guestName = this.getGuestNameFromURL();
    const guestCategory = this.getGuestCategoryFromURL();
    const inviteCode = this.getInviteCodeFromURL();
    const storageKey = buildGuestStorageKey(guestName, guestCategory, inviteCode);

    this.state = {
      gamePhase: this.getInitialPhaseFromURL(),
      guestName,
      guestCategory,
      inviteCode,
      rsvpStorageKey: storageKey,
      playerConfig: {
        gender: 'male', // 'male' | 'female'
        skinColor: '#F1C27D',
        hairStyle: 'short', // 'short' | 'long' | 'wavy' | 'bun' | 'hijab' | 'cap'
        hairColor: '#2C1B18',
        outfit: 'traditional_gold', // 'traditional_gold' | 'traditional_maroon' | 'tuxedo' | 'beskap_hitam' | 'dress' | 'kebaya_putih'
        accessory: 'none', // 'none' | 'glasses' | 'flower' | 'crown'
        expression: 'happy' // 'happy' | 'wink' | 'smile'
      },
      playerPosition: { x: 400, y: 300, direction: 'down', isMoving: false },
      activeModal: this.getInitialModalFromURL(),
      rsvpData: this.loadRSVP(guestName, guestCategory, storageKey),
      audioState: { isBgmPlaying: false, isMuted: false }
    };
  }

  getGuestCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat') || params.get('category') || params.get('group') || 'A';
    return normalizeInvitationCategory(cat);
  }

  getInviteCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return sanitizeGuestText(params.get('invite') || params.get('code') || '', 32);
  }

  getInitialModalFromURL() {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('modal');
    if (m && Object.values(MODALS).includes(m)) return m;
    const p = params.get('phase');
    if (p === 'rsvp') return MODALS.RSVP;
    if (p === 'closing') return MODALS.CLOSING_VIDEO;
    return MODALS.NONE;
  }

  getInitialPhaseFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return PHASES.EXPLORATION;
    }
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDebug = params.get('debug') === '1' || params.get('debug') === 'true';
    if (isLocal || isDebug) {
      const p = params.get('phase');
      const v = params.get('view');
      if (p === 'adjie_prototype' || v === 'adjie_prototype') return PHASES.ADJIE_PROTOTYPE;
      if (p === 'hall' || p === 'main_hall') return PHASES.MAIN_HALL;
      if (p === 'opening' || p === 'opening_video') return PHASES.OPENING_VIDEO;
      if (p === 'exploration' || p === 'rsvp' || p === 'closing') return PHASES.EXPLORATION;
      if (p === 'avatar' || p === 'avatar_creator') return PHASES.AVATAR_CREATOR;
      if (params.has('view')) return PHASES.EXPLORATION;
    }
    return PHASES.COVER;
  }

  getGuestNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sanitized = sanitizeGuestText(params.get('to') || '', 60);
    return sanitized || 'Tamu Undangan';
  }

  loadRSVP(guestName, guestCategory, storageKey) {
    const maxQuota = getMaxGuestQuota(guestCategory);
    const fallback = { attending: null, guestCount: 1, table: null, seat: null };
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return fallback;

      // Guard against cross-guest leakage even on similar slugs
      const savedName = sanitizeGuestText(parsed.guestName || '', 60).toLowerCase();
      const expectedName = sanitizeGuestText(guestName, 60).toLowerCase();
      const savedCat = normalizeInvitationCategory(parsed.invitation_category || parsed.category);
      if (savedName !== expectedName || savedCat !== guestCategory) {
        return fallback;
      }

      const clampedCount = parsed.attending === false
        ? 0
        : Math.max(1, Math.min(maxQuota, parseInt(parsed.guestCount ?? 1, 10) || 1));

      return { ...fallback, ...parsed, guestCount: clampedCount };
    } catch (e) {
      return fallback;
    }
  }

  saveRSVP(data) {
    const key = this.state.rsvpStorageKey || buildGuestStorageKey(this.state.guestName, this.state.guestCategory, this.state.inviteCode);
    const maxQuota = getMaxGuestQuota(this.state.guestCategory);
    const normalizedCount = data.attending === false
      ? 0
      : Math.max(1, Math.min(maxQuota, parseInt(data.guestCount ?? this.state.rsvpData?.guestCount ?? 1, 10) || 1));

    this.state.rsvpData = {
      ...this.state.rsvpData,
      ...data,
      guestName: this.state.guestName,
      invitation_category: this.state.guestCategory,
      guestCount: normalizedCount
    };
    try {
      localStorage.setItem(key, JSON.stringify(this.state.rsvpData));
    } catch (e) {
      console.warn('LocalStorage unavailable');
    }
    this.notify();
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  setPhase(phase) {
    this.setState({ gamePhase: phase });
  }

  setModal(modal) {
    this.setState({ activeModal: modal });
  }

  updatePlayerConfig(partialConfig) {
    this.setState({
      playerConfig: { ...this.state.playerConfig, ...partialConfig }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const gameState = new GameState();
