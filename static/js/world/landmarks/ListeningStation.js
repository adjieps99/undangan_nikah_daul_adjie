import * as THREE from 'three';

export class ListeningStation {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-24, 1.0, 8);
    this.group.rotation.y = -Math.PI / 2;
    this.buildStation();
  }

  buildStation() {
    const deckMat = new THREE.MeshLambertMaterial({ color: '#3d2616' });
    const neonHeadphoneMat = new THREE.MeshLambertMaterial({ color: '#1ed760', emissive: 0x0f6628 });
    const earCupMat = new THREE.MeshLambertMaterial({ color: '#222228' });
    const cushionMat = new THREE.MeshLambertMaterial({ color: '#f3e9dc' });
    const tableMat = new THREE.MeshLambertMaterial({ color: '#1a1a24' });

    // 1. Circular Wooden Lounge Deck
    const deckGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.35, 24);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.17;
    this.group.add(deck);

    // 2. Oversized Glowing Headphone Sculpture Arch overhead
    // Headband Arch (Torus section)
    const archGeo = new THREE.TorusGeometry(3.2, 0.18, 12, 32, Math.PI);
    const arch = new THREE.Mesh(archGeo, neonHeadphoneMat);
    arch.position.set(0, 3.2, -0.4);
    this.group.add(arch);

    // Left Ear Cup
    const leftCup = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.45, 16), earCupMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-3.2, 3.2, -0.4);
    this.group.add(leftCup);

    const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 16), neonHeadphoneMat);
    leftRing.rotation.y = Math.PI / 2;
    leftRing.position.set(-3.45, 3.2, -0.4);
    this.group.add(leftRing);

    // Right Ear Cup
    const rightCup = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.45, 16), earCupMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(3.2, 3.2, -0.4);
    this.group.add(rightCup);

    const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 16), neonHeadphoneMat);
    rightRing.rotation.y = Math.PI / 2;
    rightRing.position.set(3.45, 3.2, -0.4);
    this.group.add(rightRing);

    // 3. Cozy Curved Lounge Sofa
    const sofaGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.6, 20, 1, false, Math.PI * 0.8, Math.PI * 1.4);
    const sofa = new THREE.Mesh(sofaGeo, cushionMat);
    sofa.position.set(0, 0.5, 0);
    this.group.add(sofa);

    // Throw Pillows
    const pillowMat = new THREE.MeshLambertMaterial({ color: '#ffb703' });
    [-1.6, 0, 1.6].forEach(px => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.2), pillowMat);
      pillow.position.set(px, 0.9, -1.8);
      pillow.rotation.y = px * 0.2;
      this.group.add(pillow);
    });

    // 4. Center Audio Turntable Station Table
    const centerTable = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.65, 16), tableMat);
    centerTable.position.set(0, 0.5, 0.4);
    this.group.add(centerTable);

    // Vinyl Record & Turntable Arm
    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.04, 16), new THREE.MeshBasicMaterial({ color: '#000000' }));
    vinyl.position.set(0, 0.85, 0.4);
    this.group.add(vinyl);

    const vinylLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), neonHeadphoneMat);
    vinylLabel.position.set(0, 0.86, 0.4);
    this.group.add(vinylLabel);
  }
}
