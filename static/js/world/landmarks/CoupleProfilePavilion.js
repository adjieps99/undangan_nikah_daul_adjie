import * as THREE from 'three';

export class CoupleProfilePavilion {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(18, 2.0, -6);
    this.group.rotation.y = -Math.PI / 2;
    this.buildPavilion();
  }

  buildPavilion() {
    const teakMat = new THREE.MeshLambertMaterial({ color: '#4a2c17' });
    const floorMat = new THREE.MeshLambertMaterial({ color: '#d9cdb8' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ff758f' });
    const lightMat = new THREE.MeshLambertMaterial({ color: '#ffeaa7', emissive: 0xaa7711 });

    // 1. Raised Stone Base & Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 7.2), floorMat);
    deck.position.y = 0.15;
    this.group.add(deck);

    // 2. 4 Teak Timber Pergola Columns
    const postGeo = new THREE.BoxGeometry(0.35, 3.6, 0.35);
    const postCoords = [
      [-3.0, -3.0], [3.0, -3.0],
      [-3.0, 3.0], [3.0, 3.0]
    ];
    postCoords.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, teakMat);
      post.position.set(px, 1.8, pz);
      this.group.add(post);
    });

    // 3. Pergola Overhead Roof Beams
    const beamGeo = new THREE.BoxGeometry(7.6, 0.25, 0.3);
    for (let z = -3.0; z <= 3.0; z += 1.5) {
      const beam = new THREE.Mesh(beamGeo, teakMat);
      beam.position.set(0, 3.6, z);
      this.group.add(beam);
    }

    // 4. Carved Name Banner: "ADJIE & DAUL"
    const banner = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.08), goldMat);
    banner.position.set(0, 3.2, 3.0);
    this.group.add(banner);

    // 5. Centerpiece Portrait Easel with Framed Photo
    const easelMat = new THREE.MeshLambertMaterial({ color: '#2a1a0e' });
    const easelLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), easelMat);
    easelLeg1.position.set(-0.5, 1.1, -0.4);
    easelLeg1.rotation.z = -0.15;
    this.group.add(easelLeg1);

    const easelLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), easelMat);
    easelLeg2.position.set(0.5, 1.1, -0.4);
    easelLeg2.rotation.z = 0.15;
    this.group.add(easelLeg2);

    const easelBack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), easelMat);
    easelBack.position.set(0, 1.1, -0.8);
    easelBack.rotation.x = -0.25;
    this.group.add(easelBack);

    // Golden Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), goldMat);
    frame.position.set(0, 1.4, -0.4);
    frame.rotation.x = -0.1;
    this.group.add(frame);

    // Canvas Art Inside Frame
    const canvasArt = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshLambertMaterial({ color: '#ffcad4' }));
    canvasArt.position.set(0, 1.4, -0.35);
    canvasArt.rotation.x = -0.1;
    this.group.add(canvasArt);

    // 6. Warm Festoon String Lights around Pergola
    for (let i = 0; i < 8; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
      const angle = (i / 8) * Math.PI * 2;
      bulb.position.set(Math.cos(angle) * 2.8, 3.4, Math.sin(angle) * 2.8);
      this.group.add(bulb);
    }

    // 7. Cascading Floral Vines (Melati & Roses)
    for (let f = 0; f < 12; f++) {
      const flw = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flowerMat);
      flw.position.set((Math.random() - 0.5) * 6, 3.4 - Math.random() * 0.8, (Math.random() - 0.5) * 6);
      this.group.add(flw);
    }
  }
}
