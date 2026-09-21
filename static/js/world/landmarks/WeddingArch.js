import * as THREE from 'three';

export class WeddingArch {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 30);
    this.build();
  }

  build() {
    const pillarMat = new THREE.MeshLambertMaterial({ color: '#5c4033' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ff4d6d' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });

    // Pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7), pillarMat);
    p1.position.set(-4, 3.5, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7), pillarMat);
    p2.position.set(4, 3.5, 0);
    this.group.add(p1);
    this.group.add(p2);

    // Top Arch Beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 0.6), goldMat);
    beam.position.set(0, 7, 0);
    this.group.add(beam);

    // Floral Clusters
    for (let i = -4; i <= 4; i += 1.5) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), flowerMat);
      flower.position.set(i, 7.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.5);
      this.group.add(flower);
    }
  }
}
