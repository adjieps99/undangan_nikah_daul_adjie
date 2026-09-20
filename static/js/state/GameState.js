/**
 * GameState - Central Observable State Manager
 */
export const PHASES = {
  COVER: 'COVER',
  AVATAR_CREATOR: 'AVATAR_CREATOR',
  EXPLORATION: 'EXPLORATION',
  MODAL: 'MODAL'
};

export const MODALS = {
  NONE: null,
  PROFILE: 'profile',
  LOCATION: 'location',
  RSVP: 'rsvp',
  GIFT: 'gift',
  WISHES: 'wishes'
};

class GameState {
  constructor() {
    this.listeners = new Set();
    this.state = {
      gamePhase: PHASES.COVER,
      guestName: this.getGuestNameFromURL(),
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
      activeModal: MODALS.NONE,
      rsvpData: this.loadRSVP(),
      audioState: { isBgmPlaying: false, isMuted: false }
    };
  }

  getGuestNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('to') || 'Tamu Undangan';
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
