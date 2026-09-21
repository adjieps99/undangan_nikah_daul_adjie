import * as THREE from 'three';

export class WishingTree {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-12, 0, 15);
    this.build();
  }

  build() {
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const barkWoodMat = new THREE.MeshLambertMaterial({ color: '#5c3d2e' });
    const leafPinkMat = new THREE.MeshLambertMaterial({ color: '#ffb7c5' });
    const leafBlushMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const leafWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const cardCreamMat = new THREE.MeshLambertMaterial({ color: '#fffdf9' });
    const floorPatternMat = new THREE.MeshLambertMaterial({ color: '#d99b9b', side: THREE.DoubleSide });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // Platform
    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.3, 8), darkCreamMat);
    baseMat.position.y = 0.15;
    this.group.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.22, 5.22, 0.08, 8), goldMat);
    baseTrim.position.y = 0.29;
    this.group.add(baseTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.3, 8), creamMat);
    topStep.position.y = 0.44;
    this.group.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.42, 4.42, 0.08, 8), goldMat);
    topStepTrim.position.y = 0.58;
    this.group.add(topStepTrim);

    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.8), darkCreamMat);
    stepMesh.position.set(0, 0.1, -4.8);
    this.group.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.05, 0.85), goldMat);
    stepEdge.position.set(0, 0.18, -4.8);
    this.group.add(stepEdge);

    const floorRing = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.2, 16), floorPatternMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0, 0.6, 0);
    this.group.add(floorRing);

    const heartMesh = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), floorPatternMat);
    heartMesh.rotation.x = -Math.PI / 2;
    heartMesh.scale.set(1.0, 1.0, 1.0);
    heartMesh.position.set(0, 0.6, 0);
    this.group.add(heartMesh);

    // Balustrade
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const rx = Math.cos(angle) * 4.2;
      const rz = Math.sin(angle) * 4.2;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.45), creamMat);
      post.position.set(rx, 0.95, rz);
      this.group.add(post);

      const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), goldMat);
      postCap.position.set(rx, 1.45, rz);
      this.group.add(postCap);
    }

    for (let i = 0; i < 6; i++) {
      const a1 = (i * Math.PI) / 4 + Math.PI / 8;
      const a2 = ((i + 1) * Math.PI) / 4 + Math.PI / 8;
      const p1 = { x: Math.cos(a1) * 4.2, z: Math.sin(a1) * 4.2 };
      const p2 = { x: Math.cos(a2) * 4.2, z: Math.sin(a2) * 4.2 };

      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.z + p2.z) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

      const barGroup = new THREE.Group();
      barGroup.position.set(mx, 0, mz);
      barGroup.rotation.y = -angle;

      const bar = new THREE.Mesh(new THREE.BoxGeometry(dist - 0.4, 0.1, 0.15), goldMat);
      bar.position.y = 1.2;
      barGroup.add(bar);

      const hCutout = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      hCutout.scale.set(0.25, 0.25, 0.25);
      hCutout.position.set(0, 0.9, 0);
      barGroup.add(hCutout);

      this.group.add(barGroup);
    }

    // Trunk
    const trunkGroup = new THREE.Group();
    trunkGroup.position.set(0, 0.6, 0);

    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 2.2, 8), barkWoodMat);
    trunkBase.position.y = 1.1;
    trunkGroup.add(trunkBase);

    const trunkMid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.5, 8), barkWoodMat);
    trunkMid.position.set(0.2, 3.2, -0.1);
    trunkMid.rotation.z = -0.15;
    trunkGroup.add(trunkMid);

    const trunkHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    trunkHeart.scale.set(0.5, 0.5, 0.5);
    trunkHeart.position.set(0.45, 2.8, 0.6);
    trunkHeart.rotation.y = 0.3;
    trunkGroup.add(trunkHeart);

    const ribbonWrap = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 16), pinkRibbonMat);
    ribbonWrap.rotation.x = Math.PI / 3;
    ribbonWrap.position.set(0.1, 2.5, 0.1);
    trunkGroup.add(ribbonWrap);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.0, 6), barkWoodMat);
    b1.position.set(-1.0, 4.8, 0.4);
    b1.rotation.z = 0.55;
    trunkGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.0, 6), barkWoodMat);
    b2.position.set(1.2, 4.8, -0.4);
    b2.rotation.z = -0.55;
    trunkGroup.add(b2);

    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.8, 6), barkWoodMat);
    b3.position.set(0.1, 5.0, 1.2);
    b3.rotation.x = -0.5;
    trunkGroup.add(b3);

    this.group.add(trunkGroup);

    // Canopy
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 6.2, 0);

    const clusters = [
      { x: 0, y: 1.5, z: 0, r: 2.8, mat: leafPinkMat },
      { x: -1.8, y: 0.8, z: 1.0, r: 2.2, mat: leafBlushMat },
      { x: 1.8, y: 0.8, z: -1.0, r: 2.2, mat: leafPinkMat },
      { x: 1.2, y: 1.2, z: 1.5, r: 2.0, mat: leafWhiteMat },
      { x: -1.4, y: 1.2, z: -1.4, r: 2.0, mat: leafBlushMat },
      { x: 0, y: 2.5, z: 0, r: 2.2, mat: leafPinkMat },
      { x: 2.4, y: 0.2, z: 0.5, r: 1.6, mat: leafWhiteMat },
      { x: -2.4, y: 0.2, z: -0.5, r: 1.6, mat: leafBlushMat }
    ];

    clusters.forEach(c => {
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r), c.mat);
      mesh.position.set(c.x, c.y, c.z);
      canopyGroup.add(mesh);
    });
    this.group.add(canopyGroup);

    // Hanging cards
    const wishCardPositions = [
      { x: -1.8, y: 5.5, z: 1.2 },
      { x: 1.8, y: 5.3, z: -1.0 },
      { x: 1.2, y: 5.6, z: 1.5 },
      { x: -1.4, y: 5.2, z: -1.4 },
      { x: 2.2, y: 5.0, z: 0.4 },
      { x: -2.2, y: 5.0, z: 0.4 },
      { x: 0, y: 5.7, z: 2.0 },
      { x: 0.8, y: 5.1, z: -2.0 }
    ];

    wishCardPositions.forEach(p => {
      const cardGroup = new THREE.Group();
      cardGroup.position.set(p.x, p.y, p.z);

      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6), goldMat);
      string.position.y = 0.3;
      cardGroup.add(string);

      const card = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.02), cardCreamMat);
      cardGroup.add(card);

      const cardHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      cardHeart.scale.set(0.12, 0.12, 0.12);
      cardHeart.position.set(0, 0.05, 0.02);
      cardGroup.add(cardHeart);

      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.25), pinkRibbonMat);
      tassel.position.y = -0.32;
      cardGroup.add(tassel);

      this.group.add(cardGroup);
    });

    const addRoseCluster = (x, y, z, count = 3) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      for (let r = 0; r < count; r++) {
        const isPink = r % 2 === 0;
        const roseMat = isPink ? leafBlushMat : leafWhiteMat;
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.05), roseMat);
        rose.position.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35);
        cluster.add(rose);

        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.25), leafGreenMat);
        leaf.position.copy(rose.position);
        leaf.position.x += (Math.random() - 0.5) * 0.3;
        leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        cluster.add(leaf);
      }
      this.group.add(cluster);
    };

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const fx = Math.cos(angle) * 3.2;
      const fz = Math.sin(angle) * 3.2;
      addRoseCluster(fx, 0.75, fz, 3);
    }
  }
}
