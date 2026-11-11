/**
 * GameState - Central Observable State Manager
 */
export const PHASES = {
  COVER: 'COVER',
  AVATAR_CREATOR: 'AVATAR_CREATOR',
  OPENING_VIDEO: 'OPENING_VIDEO',
  EXPLORATION: 'EXPLORATION',
  MAIN_HALL: 'MAIN_HALL',
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
    this.state = {
      gamePhase: this.getInitialPhaseFromURL(),
      guestName: this.getGuestNameFromURL(),
      guestCategory: this.getGuestCategoryFromURL(),
      playerConfig: {
        gender: 'male', // 'male' | 'female'
        skinColor: '#F1C27D',
        hairStyle: 'short', // 'short' | 'long' | 'wavy' | 'bun' | 'hijab' | 'cap'
        hairColor: '#2C1B18',
        outfit: 'traditional_gold', // 'traditional_gold' | 'traditional_maroon' | 'tuxedo' | 'dress'
        accessory: 'none', // 'none' | 'glasses' | 'flower' | 'crown'
        expression: 'happy' // 'happy' | 'wink' | 'smile'
      },
      playerPosition: { x: 400, y: 300, direction: 'down', isMoving: false },
      activeModal: this.getInitialModalFromURL(),
      rsvpData: this.loadRSVP(),
      audioState: { isBgmPlaying: false, isMuted: false }
    };
  }

  getGuestCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = (params.get('cat') || params.get('category') || params.get('group') || 'A').toUpperCase().trim();
    return cat === 'B' ? 'B' : 'A';
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
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDebug = params.get('debug') === '1' || params.get('debug') === 'true';
    if (isLocal || isDebug) {
      const p = params.get('phase');
      if (p === 'hall' || p === 'main_hall') return PHASES.MAIN_HALL;
      if (p === 'exploration' || p === 'rsvp' || p === 'closing') return PHASES.EXPLORATION;
      if (p === 'avatar' || p === 'avatar_creator') return PHASES.AVATAR_CREATOR;
      if (params.has('view')) return PHASES.EXPLORATION;
    }
    return PHASES.COVER;
  }

  getGuestNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('to');
    if (!raw) return 'Tamu Undangan';
    // Strip control characters, trim, and cap length to 60 characters
    const sanitized = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    return sanitized.slice(0, 60) || 'Tamu Undangan';
  }

  loadRSVP() {
    try {
      const saved = localStorage.getItem('wedding_rsvp');
      return saved ? JSON.parse(saved) : { attending: null, guestCount: 1, table: null, seat: null };
    } catch (e) {
      return { attending: null, guestCount: 1, table: null, seat: null };
    }
  }

  saveRSVP(data) {
    this.state.rsvpData = { ...this.state.rsvpData, ...data };
    try {
      localStorage.setItem('wedding_rsvp', JSON.stringify(this.state.rsvpData));
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
