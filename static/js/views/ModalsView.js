import { gameState, MODALS } from '../state/GameState.js';
import { createProfileModal } from './modals/ProfileModal.js';
import { createLocationModal } from './modals/LocationModal.js';
import { createRSVPModal } from './modals/RSVPModal.js';
import { createWishesModal } from './modals/WishesModal.js';
import { createGiftModal } from './modals/GiftModal.js';

export class ModalsView {
  constructor() {
    this.currentModalElement = null;
  }

  render(activeModal) {
    if (this.currentModalElement) {
      this.currentModalElement.remove();
      this.currentModalElement = null;
    }

    if (!activeModal) return null;

    switch (activeModal) {
      case MODALS.PROFILE:
        this.currentModalElement = createProfileModal();
        break;
      case MODALS.LOCATION:
        this.currentModalElement = createLocationModal();
        break;
      case MODALS.RSVP:
        this.currentModalElement = createRSVPModal();
        break;
      case MODALS.WISHES:
        this.currentModalElement = createWishesModal();
        break;
      case MODALS.GIFT:
        this.currentModalElement = createGiftModal();
        break;
    }

    return this.currentModalElement;
  }
}
