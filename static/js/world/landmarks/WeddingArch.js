import * as THREE from 'three';

/**
 * WeddingArch - Akad Nikah Floral Pergola (Sunda & Lombok Heritage)
 * Features curved wooden arches, cascading jasmine (ronce melati), rose blossoms,
 * carved stone bases, and warm ceremonial lanterns.
 */
export class WeddingArch {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-2, 3.5, -2);
    this.build();
  }

  build() {
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#4a2e1b' });
    const carvedStoneMat = new THREE.MeshLambertMaterial({ color: '#59504a' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const jasmineMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#e85d75' });
    const rosePeachMat = new THREE.MeshLambertMaterial({ color: '#fca311' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    const warmGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe6a7', emissive: 0x664411 });

    // 1. Carved Stone Plinths
    for (const xOffset of [-2.4, 2.4]) {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), carvedStoneMat);
      plinth.position.set(xOffset, 0.4, 0);
      this.group.add(plinth);

      // Gold ornament band
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.12, 1.06), goldMat);
      trim.position.set(xOffset, 0.8, 0);
      this.group.add(trim);

      // Teak Wood Columns
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.2, 12), darkWoodMat);
      column.position.set(xOffset, 2.9, 0);
      this.group.add(column);

      // Capital on top of column
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), goldMat);
      cap.position.set(xOffset, 5.05, 0);
      this.group.add(cap);
    }

    // 2. Main Curved Floral Timber Arch Header
    const archCurve = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.24, 10, 24, Math.PI), darkWoodMat);
    archCurve.rotation.z = 0;
    archCurve.position.set(0, 5.0, 0);
    this.group.add(archCurve);

    // Secondary decorative inner bamboo/timber rib
    const innerRib = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 8, 20, Math.PI), goldMat);
    innerRib.position.set(0, 5.0, 0);
    this.group.add(innerRib);

    // 3. Hanging Ceremonial Lantern in Arch Center
    const lanternCord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2), darkWoodMat);
    lanternCord.position.set(0, 6.7, 0);
    this.group.add(lanternCord);

    const lanternCage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), darkWoodMat);
    lanternCage.position.set(0, 5.9, 0);
    this.group.add(lanternCage);

    const lanternLight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.38), warmGlowMat);
    lanternLight.position.set(0, 5.9, 0);
    this.group.add(lanternLight);

    // 4. Lush Floral Garland on Arch (Jasmine, Roses, Foliage)
    for (let angle = 0; angle <= Math.PI; angle += 0.22) {
      const radius = 2.45;
      const fx = Math.cos(angle) * radius;
      const fy = 5.0 + Math.sin(angle) * radius;
      const fz = (Math.random() - 0.5) * 0.4;

      // Leaf clump
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), leafGreenMat);
      leaf.position.set(fx, fy, fz);
      this.group.add(leaf);

      // Flower bloom (alternating pink rose and jasmine white)
      const mat = Math.random() > 0.4 ? rosePinkMat : (Math.random() > 0.5 ? rosePeachMat : jasmineMat);
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), mat);
      bloom.position.set(fx + (Math.random() - 0.5) * 0.2, fy + (Math.random() - 0.5) * 0.2, fz + 0.15);
      this.group.add(bloom);

      // Cascading Ronce Melati (hanging white strands on both sides)
      if (angle < 0.8 || angle > 2.3) {
        for (let strand = 1; strand <= 3; strand++) {
          const drop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), jasmineMat);
          drop.position.set(fx, fy - strand * 0.28, fz + 0.1);
          this.group.add(drop);
        }
      }
    }

    // 5. White & Gold Akad Ceremony Carpet Runner
    const carpetGeo = new THREE.PlaneGeometry(2.4, 7.0);
    const carpetMat = new THREE.MeshLambertMaterial({ color: '#f8f4eb' });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.03, 1.5);
    this.group.add(carpet);

    // Gold carpet border trims
    for (const xSide of [-1.22, 1.22]) {
      const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 7.0), goldMat);
      trim.rotation.x = -Math.PI / 2;
      trim.position.set(xSide, 0.035, 1.5);
      this.group.add(trim);
    }

    // 6. Flanking Floral Stands along Ceremony Steps
    for (const zStep of [0, 2.5, 4.5]) {
      for (const xSide of [-1.6, 1.6]) {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.1, 8), darkWoodMat);
        stand.position.set(xSide, 0.55, zStep);
        this.group.add(stand);

        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.35, 8), carvedStoneMat);
        pot.position.set(xSide, 1.15, zStep);
        this.group.add(pot);

        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), leafGreenMat);
        bush.position.set(xSide, 1.5, zStep);
        this.group.add(bush);

        const topRose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), rosePinkMat);
        topRose.position.set(xSide, 1.75, zStep);
        this.group.add(topRose);
      }
    }
  }
}
