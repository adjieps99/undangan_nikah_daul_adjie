import * as THREE from 'three';
import { gameState, MODALS, PHASES } from '../state/GameState.js';

export const POI_REGISTRY_3D = [
  { id: 'location', name: 'Pintu Masuk Hachi Garden', x: 0, y: 0.0, z: 28, radius: 5.5, icon: '🌿', label: 'Waktu & Lokasi', modal: MODALS.LOCATION },
  { id: 'profile', name: 'Couple Profile (Adjie & Daul)', x: 18, y: 2.0, z: -6, radius: 5.8, icon: '💍', label: 'Mengenal Adjie & Daul', modal: MODALS.PROFILE },
  { id: 'gallery', name: 'Photo Gallery & Cerita', x: 18, y: 2.0, z: 8, radius: 5.5, icon: '📸', label: 'Kumpulan Foto & Cerita', modal: MODALS.GALLERY },
  { id: 'listening', name: 'Listening Station', x: -24, y: 1.0, z: 8, radius: 6.2, icon: '🎧', label: 'Playlist Perjalanan Kami', modal: MODALS.LISTENING },
  { id: 'foodcourt', name: 'Food Court Favorit', x: -24, y: 3.2, z: -10, radius: 6.2, icon: '🍜', label: 'Makanan & Cerita Kencan', modal: MODALS.FOODCOURT },
  { id: 'rsvp', name: 'The Hachi Garden (Restoran & RSVP)', x: 0, y: 5.0, z: -16.5, radius: 6.8, icon: '✉️', label: 'Detail Acara & RSVP', modal: MODALS.RSVP }
];

export class InteractionSystem {
  constructor(scene) {
    this.scene = scene;
    this.nearbyPOI = null;
    this.poiGroup = new THREE.Group();
    this.scene.add(this.poiGroup);

    this.buildWeddingPOIMarkers();
  }

  buildWeddingPOIMarkers() {
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37', transparent: true, opacity: 0.6 });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ff4d6d' });

    POI_REGISTRY_3D.forEach((poi) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(poi.x, (poi.y || 0) + 0.08, poi.z);

      // Subtle Glowing Base Disc
      const discGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 16);
      const disc = new THREE.Mesh(discGeo, goldMat);
      markerGroup.add(disc);

      // Decorative Floral Accents along Ring
      for (let a = 0; a < 4; a++) {
        const angle = (a * Math.PI) / 2;
        const petal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), flowerMat);
        petal.position.set(Math.cos(angle) * 2.2, 0.2, Math.sin(angle) * 2.2);
        markerGroup.add(petal);
      }

      this.poiGroup.add(markerGroup);
    });
  }

  update(characterPosition) {
    this.nearbyPOI = null;
    if (!characterPosition) return null;

    for (const poi of POI_REGISTRY_3D) {
      const dist = Math.hypot(characterPosition.x - poi.x, characterPosition.z - poi.z);
      if (dist < poi.radius) {
        this.nearbyPOI = poi;
        break;
      }
    }

    // Gentle pulse animation
    this.poiGroup.children.forEach((marker) => {
      marker.rotation.y += 0.01;
    });

    return this.nearbyPOI;
  }

  triggerInteraction() {
    if (!this.nearbyPOI) return;
    if (this.nearbyPOI.id === 'rsvp') {
      const rsvpData = gameState.getState().rsvpData;
      if (rsvpData && rsvpData.attending === true) {
        // Guest already RSVP'd! Enter Main Reception Hall smoothly
        gameState.setState({
          lastOutdoorPosition: { x: 0.0, y: 5.0, z: -14.0, rotY: Math.PI },
          gamePhase: PHASES.MAIN_HALL
        });
        return;
      }
    }
    gameState.setModal(this.nearbyPOI.modal);
  }
}
