import { gameState, MODALS } from '../state/GameState.js';
import { createProfileModal } from './modals/ProfileModal.js';
import { createLocationModal } from './modals/LocationModal.js';
import { createRSVPModal } from './modals/RSVPModal.js';
import { createWishesModal } from './modals/WishesModal.js';
import { createGiftModal } from './modals/GiftModal.js';
import { createPhotoGalleryModal } from './modals/PhotoGalleryModal.js';
import { createListeningStationModal } from './modals/ListeningStationModal.js';
import { createFoodCourtModal } from './modals/FoodCourtModal.js';
import { createClosingVideoModal } from './modals/ClosingVideoModal.js';

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
      case MODALS.GALLERY:
        this.currentModalElement = createPhotoGalleryModal();
        break;
      case MODALS.LISTENING:
        this.currentModalElement = createListeningStationModal();
        break;
      case MODALS.FOODCOURT:
        this.currentModalElement = createFoodCourtModal();
        break;
      case MODALS.LOCATION:
        this.currentModalElement = createLocationModal();
        break;
      case MODALS.RSVP:
        this.currentModalElement = createRSVPModal();
        break;
      case MODALS.CLOSING_VIDEO:
        this.currentModalElement = createClosingVideoModal();
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
