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
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampMat);
      lamp.position.set(lx, 3.8, 0);
      this.group.add(lamp);
    });

    // 7. Menu Board Signboard Texture & Heading
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1c1b18';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#f5e6a3';
      ctx.font = 'bold 26px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍜 KULINER FAVORIT KAMI ☕', 256, 48);
      ctx.fillStyle = '#ffbe97';
      ctx.font = '18px sans-serif';
      ctx.fillText('Mie Ayam Jamur • Es Kopi Aren • Pisang Karamel', 256, 88);
    }
    const boardTex = new THREE.CanvasTexture(canvas);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 1.1, 0.1),
      new THREE.MeshLambertMaterial({ map: boardTex })
    );
    signBoard.position.set(0, 3.0, -3.6);
    this.group.add(signBoard);

    // 8. Culinary Props on Counter (Mie Ayam bowl, Es Kopi cup, Pisang Goreng plate)
    const ceramicMat = new THREE.MeshLambertMaterial({ color: '#f8f4eb' });
    const noodleMat = new THREE.MeshLambertMaterial({ color: '#c9933b' });
    const glassMat = new THREE.MeshLambertMaterial({ color: '#3d2514', transparent: true, opacity: 0.85 });

    // Bowl 1: Mie Ayam Jamur
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.2, 0.22, 12), ceramicMat);
    bowl.position.set(-1.2, 1.35, -3.2);
    const noodles = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), noodleMat);
    noodles.scale.set(1, 0.35, 1);
    noodles.position.set(-1.2, 1.44, -3.2);
    this.group.add(bowl);
    this.group.add(noodles);

    // Glass 2: Es Kopi Susu
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.35, 10), glassMat);
    cup.position.set(0.0, 1.42, -3.2);
    this.group.add(cup);

    // Plate 3: Pisang Goreng Keju
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.08, 12), ceramicMat);
    plate.position.set(1.2, 1.32, -3.2);
    const fritter = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.25), new THREE.MeshLambertMaterial({ color: '#d9822b' }));
    fritter.position.set(1.2, 1.4, -3.2);
    this.group.add(plate);
    this.group.add(fritter);

    // 9. Welcoming Entrance Torii Lantern Posts at Landing Approach
    const entranceLanternMat = new THREE.MeshLambertMaterial({ color: '#ffb703', emissive: 0xaa6600 });
    [-2.6, 2.6].forEach(px => {
      const lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), woodMat);
      lanternPost.position.set(px, 1.3, 4.3);
      const lanternTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), entranceLanternMat);
      lanternTop.position.set(px, 2.5, 4.3);
      this.group.add(lanternPost);
      this.group.add(lanternTop);
    });
  }
}
