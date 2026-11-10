import * as THREE from 'three';

/**
 * FountainPond - Spot Foto: Circular Wooden Viewing Deck (Anjungan Pandang Teh)
 * Cantilevered circular timber terrace overlooking the stepped tea garden & Rinjani mountain.
 * Features carved balustrades, flower planter boxes, stone lanterns, and photo podium.
 */
export class FountainPond {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-16, 1.2, 12);
    this.build();
  }

  build() {
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#452c1b' });
    const deckPlankMat = new THREE.MeshLambertMaterial({ color: '#573822' });
    const stoneBaseMat = new THREE.MeshLambertMaterial({ color: '#3d3733' });
    const goldOrnamentMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const floralPinkMat = new THREE.MeshLambertMaterial({ color: '#e85d75' });
    const floralWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    const lanternGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe082', emissive: 0x885511 });

    // 1. Circular Stone Terrace Foundation
    const stoneFoundation = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.6, 24), stoneBaseMat);
    stoneFoundation.position.set(0, 0.3, 0);
    this.group.add(stoneFoundation);

    // 2. Circular Teak Deck Platform
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 0.16, 24), deckPlankMat);
    deck.position.set(0, 0.68, 0);
    this.group.add(deck);

    // Gold Inset Compass / Lotus Centerpiece Disc
    const centerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.04, 16), goldOrnamentMat);
    centerDisc.position.set(0, 0.77, 0);
    this.group.add(centerDisc);

    // Photo Center Heart Emblem
    const heartSign = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), floralPinkMat);
    heartSign.position.set(0, 1.1, 0);
    this.group.add(heartSign);

    // 3. Perimeter Wooden Balustrade Railing & Lantern Posts
    const totalPosts = 14;
    const radius = 5.1;
    for (let i = 0; i < totalPosts; i++) {
      const angle = (i / totalPosts) * Math.PI * 2;

      // Leave open entrance gap on the north-east side (towards pathway)
      if (angle > 0.4 && angle < 1.1) continue;

      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      // Balustrade post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.1, 8), darkWoodMat);
      post.position.set(px, 1.25, pz);
      this.group.add(post);

      // Gold cap on post
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), goldOrnamentMat);
      cap.position.set(px, 1.82, pz);
      this.group.add(cap);

      // Warm Lantern on selected posts
      if (i % 3 === 0) {
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.38), darkWoodMat);
        lantern.position.set(px, 2.15, pz);
        this.group.add(lantern);

        const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.3), lanternGlowMat);
        lanternGlass.position.set(px, 2.15, pz);
        this.group.add(lanternGlass);
      }
    }

    // Top Handrail Ring (Curved Torus segments)
    const handrail = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.08, 6, 24, Math.PI * 1.65), darkWoodMat);
    handrail.rotation.x = Math.PI / 2;
    handrail.rotation.z = 1.1;
    handrail.position.set(0, 1.8, 0);
    this.group.add(handrail);

    // 4. Floral Planter Boxes along Deck Edge
    const planterAngles = [1.4, 2.3, 3.2, 4.1, 5.0, 5.9];
    planterAngles.forEach(ang => {
      const bx = Math.cos(ang) * (radius - 0.45);
      const bz = Math.sin(ang) * (radius - 0.45);

      const planterBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.4), darkWoodMat);
      planterBox.position.set(bx, 0.9, bz);
      planterBox.rotation.y = -ang + Math.PI / 2;
      this.group.add(planterBox);

      // Bush & flower blooms in planter
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), leafGreenMat);
      bush.position.set(bx, 1.15, bz);
      this.group.add(bush);

      for (let f = 0; f < 3; f++) {
        const mat = f % 2 === 0 ? floralPinkMat : floralWhiteMat;
        const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14), mat);
        fl.position.set(bx + (Math.random() - 0.5) * 0.3, 1.35, bz + (Math.random() - 0.5) * 0.3);
        this.group.add(fl);
      }
    });

    // 5. Viewing Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 0.7), darkWoodMat);
    bench.position.set(0, 0.9, -3.2);
    this.group.add(bench);
  }
}
