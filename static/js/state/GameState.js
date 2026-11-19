import {
  buildGuestStorageKey,
  normalizeInvitationCategory,
  sanitizeGuestText
} from '../utils/rsvpContract.js';

/**
 * GameState - Central Observable State Manager
 * Simple ?to=Nama Tamu personalization + strict 1-person RSVP state
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
    const isPersonalizedInvite = this.hasExplicitToParam();
    const guestName = this.getGuestNameFromURL();
    const guestCategory = 'B';
    const inviteCode = this.getInviteCodeFromURL();
    const storageKey = buildGuestStorageKey(guestName, guestCategory, inviteCode);

    this.state = {
      gamePhase: this.getInitialPhaseFromURL(),
      guestName,
      guestCategory,
      inviteCode,
      isPersonalizedInvite,
      guestCapacity: 1,
      rsvpStorageKey: storageKey,
      playerConfig: {
        gender: 'male',
        skinColor: '#F1C27D',
        hairStyle: 'short',
        hairColor: '#2C1B18',
        outfit: 'traditional_gold',
        accessory: 'none',
        expression: 'happy'
      },
      playerPosition: { x: 400, y: 300, direction: 'down', isMoving: false },
      activeModal: this.getInitialModalFromURL(),
      rsvpData: this.loadRSVP(guestName, guestCategory, storageKey),
      audioState: { isBgmPlaying: false, isMuted: false },
      hallEntranceNotice: false
    };
  }

  hasExplicitToParam() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(sanitizeGuestText(params.get('to') || '', 80));
  }

  getInviteCodeFromURL() {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return sanitizeGuestText(params.get('code') || '', 64);
  }

  getInitialModalFromURL() {
    if (typeof window === 'undefined') return MODALS.NONE;
    const params = new URLSearchParams(window.location.search);
    const m = params.get('modal');
    if (m && Object.values(MODALS).includes(m)) return m;
    const p = params.get('phase');
    if (p === 'rsvp') return MODALS.RSVP;
    if (p === 'closing') return MODALS.CLOSING_VIDEO;
    return MODALS.NONE;
  }

  getInitialPhaseFromURL() {
    if (typeof window === 'undefined') return PHASES.COVER;
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
    if (typeof window === 'undefined') return 'Tamu Undangan';
    const params = new URLSearchParams(window.location.search);
    const sanitized = sanitizeGuestText(params.get('to') || '', 80);
    return sanitized || 'Tamu Undangan';
  }

  loadRSVP(guestName, guestCategory, storageKey) {
    const fallback = {
      attending: null,
      rsvp_status: 'PENDING',
      guestCount: 0,
      guestCapacity: 1,
      table: null,
      seat: null
    };
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return fallback;

      const savedName = sanitizeGuestText(parsed.guestName || '', 80).toLowerCase();
      const expectedName = sanitizeGuestText(guestName, 80).toLowerCase();
      const savedCat = normalizeInvitationCategory(parsed.invitation_category || parsed.category);
      if (savedName !== expectedName || savedCat !== normalizeInvitationCategory(guestCategory)) {
        return fallback;
      }

      const clampedCount = parsed.attending === true ? 1 : 0;
      const rsvpStatus = parsed.rsvp_status || (parsed.attending === true ? 'WILL_ATTEND' : parsed.attending === false ? 'DECLINED' : 'PENDING');

      return { ...fallback, ...parsed, guestCount: clampedCount, guestCapacity: 1, rsvp_status: rsvpStatus };
    } catch {
      return fallback;
    }
  }

  saveRSVP(data) {
    const key = this.state.rsvpStorageKey || buildGuestStorageKey(this.state.guestName, 'B', this.state.inviteCode);
    const normalizedCount = data.attending === true ? 1 : 0;
    const rsvpStatus = data.rsvp_status || (data.attending === true ? 'WILL_ATTEND' : data.attending === false ? 'DECLINED' : 'PENDING');

    this.state.rsvpData = {
      ...this.state.rsvpData,
      ...data,
      guestName: this.state.guestName,
      invitation_category: 'B',
      guestCount: normalizedCount,
      guestCapacity: 1,
      rsvp_status: rsvpStatus
    };
    try {
      localStorage.setItem(key, JSON.stringify(this.state.rsvpData));
    } catch {
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
