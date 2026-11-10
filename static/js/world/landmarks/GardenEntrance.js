import * as THREE from 'three';

export class GardenEntrance {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0.0, 30);
    this.buildEntrance();
  }

  buildEntrance() {
    const stoneMat = new THREE.MeshLambertMaterial({ color: '#4a443e' });
    const woodMat = new THREE.MeshLambertMaterial({ color: '#3a2312' });
    const brassMat = new THREE.MeshLambertMaterial({ color: '#d4af37', emissive: 0x332200 });
    const lanternMat = new THREE.MeshLambertMaterial({ color: '#ffea88', emissive: 0xaa7711 });

    // 1. Dual Stone Gateway Pillars
    const pillarGeo = new THREE.BoxGeometry(1.2, 4.2, 1.2);
    const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
    leftPillar.position.set(-3.2, 2.1, 0);
    this.group.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
    rightPillar.position.set(3.2, 2.1, 0);
    this.group.add(rightPillar);

    // Stepped Pillar Caps
    [-3.2, 3.2].forEach(px => {
      const cap1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.4), stoneMat);
      cap1.position.set(px, 4.3, 0);
      this.group.add(cap1);

      const cap2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 4), stoneMat);
      cap2.position.set(px, 4.7, 0);
      cap2.rotation.y = Math.PI / 4;
      this.group.add(cap2);

      // Hanging Amber Lantern on each pillar
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), lanternMat);
      lantern.position.set(px > 0 ? px - 0.7 : px + 0.7, 3.2, 0.3);
      this.group.add(lantern);
    });

    // 2. Ornate Wooden Overhead Archway Beam
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.45, 0.6), woodMat);
    archBeam.position.set(0, 4.0, 0);
    this.group.add(archBeam);

    // 3. Brass Plaque "THE HACHI GARDEN"
    const plaqueGeo = new THREE.BoxGeometry(4.2, 0.7, 0.1);
    const plaque = new THREE.Mesh(plaqueGeo, brassMat);
    plaque.position.set(0, 4.0, 0.35);
    this.group.add(plaque);

    // 4. Frangipani / Planter Boxes flanking gateway
    const planterMat = new THREE.MeshLambertMaterial({ color: '#2c4021' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });

    [-4.5, 4.5].forEach(fx => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.45, 0.8, 12), stoneMat);
      pot.position.set(fx, 0.4, 0);
      this.group.add(pot);

      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), planterMat);
      bush.position.set(fx, 1.0, 0);
      this.group.add(bush);

      const flw = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), flowerMat);
      flw.position.set(fx, 1.4, 0.2);
      this.group.add(flw);
    });
  }
}
