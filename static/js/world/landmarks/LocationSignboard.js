import * as THREE from 'three';

/**
 * LocationSignboard - Pintu Masuk: Gapura Candi Bentar / Gerbang Sunda-Lombok
 * Entrance portal featuring carved andesite stone gateway, warm hanging lanterns,
 * welcome banner, and floral planters.
 */
export class LocationSignboard {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(18, 0.0, 26);
    this.build();
  }

  build() {
    const carvedStoneMat = new THREE.MeshLambertMaterial({ color: '#4a4542' });
    const darkStoneMat = new THREE.MeshLambertMaterial({ color: '#332f2d' });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#422817' });
    const goldOrnamentMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const lanternGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe082', emissive: 0x885511 });
    const floralPinkMat = new THREE.MeshLambertMaterial({ color: '#e85d75' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });

    // 1. Dual Candi Bentar Stone Gate Towers (Left & Right)
    for (const side of [-2.8, 2.8]) {
      // Base Pedestal
      const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.4), darkStoneMat);
      base1.position.set(side, 0.4, 0);
      this.group.add(base1);

      const base2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.2), carvedStoneMat);
      base2.position.set(side, 1.1, 0);
      this.group.add(base2);

      // Main Tower Shaft with Stepped Profile
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.8, 1.0), carvedStoneMat);
      shaft.position.set(side, 3.3, 0);
      this.group.add(shaft);

      // Gold Inset Relief Carving
      const relief = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 1.04), goldOrnamentMat);
      relief.position.set(side, 3.2, 0);
      this.group.add(relief);

      // Stepped Tower Crown (Candi Bentar silhouette)
      for (let step = 0; step < 4; step++) {
        const w = 1.0 - step * 0.2;
        const h = 0.35;
        const crownStep = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), darkStoneMat);
        crownStep.position.set(side, 5.35 + step * 0.35, 0);
        this.group.add(crownStep);
      }

      // Tower Peak Finial
      const topFinial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), goldOrnamentMat);
      topFinial.rotation.y = Math.PI / 4;
      topFinial.position.set(side, 6.9, 0);
      this.group.add(topFinial);

      // Lantern Bracket on Outer Side
      const bracketX = side < 0 ? side - 0.7 : side + 0.7;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), darkWoodMat);
      bracket.position.set(bracketX, 3.2, 0);
      this.group.add(bracket);

      // Hanging Amber Traditional Lantern
      const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.45), darkWoodMat);
      lanternBox.position.set(bracketX, 2.7, 0);
      this.group.add(lanternBox);

      const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.52, 0.35), lanternGlowMat);
      lanternGlass.position.set(bracketX, 2.7, 0);
      this.group.add(lanternGlass);
    }

    // 2. Connecting Timber Header Lintel & Welcome Banner
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.35, 0.5), darkWoodMat);
    lintel.position.set(0, 4.6, 0);
    this.group.add(lintel);

    const bannerBoard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 0.1), darkWoodMat);
    bannerBoard.position.set(0, 4.0, 0);
    this.group.add(bannerBoard);

    const bannerGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.9, 0.05), goldOrnamentMat);
    bannerGoldTrim.position.set(0, 4.0, 0);
    this.group.add(bannerGoldTrim);

    // 3. Stone Pathway Entrance Step
    const entranceThreshold = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 1.8), carvedStoneMat);
    entranceThreshold.position.set(0, 0.08, 0);
    this.group.add(entranceThreshold);

    // 4. Frangipani / Bougainvillea Planters Flanking Entrance
    for (const side of [-4.5, 4.5]) {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), darkStoneMat);
      planter.position.set(side, 0.3, 0);
      this.group.add(planter);

      // Bush foliage
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), leafGreenMat);
      bush.position.set(side, 1.0, 0);
      this.group.add(bush);

      // Flowers
      for (let f = 0; f < 5; f++) {
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), floralPinkMat);
        flower.position.set(side + (Math.random() - 0.5) * 0.8, 1.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8);
        this.group.add(flower);
      }
    }
  }
}
