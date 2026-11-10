import * as THREE from 'three';

export class FoodCourt {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-24, 3.2, -10);
    this.group.rotation.y = -Math.PI / 2;
    this.buildFoodCourt();
  }

  buildFoodCourt() {
    const woodMat = new THREE.MeshLambertMaterial({ color: '#4a2c17' });
    const floorMat = new THREE.MeshLambertMaterial({ color: '#7a624d' });
    const roofMat = new THREE.MeshLambertMaterial({ color: '#2b1b10' });
    const counterMat = new THREE.MeshLambertMaterial({ color: '#ded3c5' });
    const lampMat = new THREE.MeshLambertMaterial({ color: '#ffe28a', emissive: 0xbb7711 });

    // 1. Raised Timber Deck (12m x 9m)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.35, 9.0), floorMat);
    deck.position.y = 0.17;
    this.group.add(deck);

    // 2. Tall Timber Support Columns (Height 4.8m so camera never clips into ceiling)
    const postGeo = new THREE.BoxGeometry(0.35, 4.8, 0.35);
    const postCoords = [
      [-5.2, -3.8], [5.2, -3.8],
      [-5.2, 3.8], [5.2, 3.8]
    ];
    postCoords.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 2.4, pz);
      this.group.add(post);
    });

    // 3. Elevated Grand Joglo Pavilion Roof (starts at y = 4.8m, peak at y = 6.4m)
    const roofGeo = new THREE.ConeGeometry(7.8, 2.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 5.8, 0);
    this.group.add(roof);

    // 4. Café Serving Bar & Counter against back wall (local -z)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 0.8), counterMat);
    counter.position.set(0, 0.7, -3.2);
    this.group.add(counter);

    // Blackboard Sign
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.08), new THREE.MeshLambertMaterial({ color: '#1a1a1a' }));
    board.position.set(0, 3.2, -3.7);
    this.group.add(board);

    // 5. Dining Tables & Chairs placed on the left & right sides (leaving a 4.5m clear corridor)
    const tableMat = new THREE.MeshLambertMaterial({ color: '#f5f0ea' });
    const chairMat = new THREE.MeshLambertMaterial({ color: '#6d4c41' });

    [-3.8, 3.8].forEach(tx => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.75, 12), tableMat);
      table.position.set(tx, 0.55, 0.8);
      this.group.add(table);

      // Chairs around table
      for (let a = 0; a < 3; a++) {
        const ang = (a * Math.PI * 2) / 3;
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), chairMat);
        chair.position.set(tx + Math.cos(ang) * 1.3, 0.4, 0.8 + Math.sin(ang) * 1.3);
        this.group.add(chair);
      }
    });

    // 6. Warm Hanging Pendant Lanterns (elevated at y = 4.0m)
    [-3, 0, 3].forEach(lx => {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), lampMat);
      lamp.position.set(lx, 4.0, 0);
      this.group.add(lamp);
    });
  }
}
