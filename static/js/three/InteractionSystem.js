import * as THREE from 'three';
import { gameState, MODALS } from '../state/GameState.js';

export const POI_REGISTRY_3D = [
  { id: 'profile', name: 'Gazebo Pengantin (Adjie & Daul)', x: -15, y: 0, z: -12, radius: 4.5, icon: '💍', label: 'Kenali Adjie & Daul', modal: MODALS.PROFILE },
  { id: 'location', name: 'Informasi Acara & Lokasi', x: 0, y: 0, z: 0, radius: 4.5, icon: '📜', label: 'Waktu & Lokasi', modal: MODALS.LOCATION },
  { id: 'rsvp', name: 'Meja RSVP & Seating', x: 15, y: 0, z: -12, radius: 4.5, icon: '✉️', label: 'Konfirmasi RSVP', modal: MODALS.RSVP },
  { id: 'wishes', name: 'Wishing Tree & Buku Tamu', x: -12, y: 0, z: 12, radius: 4.5, icon: '🌸', label: 'Buku Tamu & Ucapan', modal: MODALS.WISHES },
  { id: 'gift', name: 'Kotak Hadiah & Digital Angpao', x: 12, y: 0, z: 12, radius: 4.5, icon: '🎁', label: 'Kirim Hadiah', modal: MODALS.GIFT }
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
      markerGroup.position.set(poi.x, 0.05, poi.z);

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
    gameState.setModal(this.nearbyPOI.modal);
  }
}
