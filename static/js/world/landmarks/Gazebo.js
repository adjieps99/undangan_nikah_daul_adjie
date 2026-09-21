import * as THREE from 'three';

export class Gazebo {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-15, 0, -15);
    this.build();
  }

  build() {
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const roseWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const floorPatternMat = new THREE.MeshLambertMaterial({ color: '#d99b9b', side: THREE.DoubleSide });

    // 1. Base Platform
    const bottomStep = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.7, 0.35, 6), darkCreamMat);
    bottomStep.position.y = 0.175;
    this.group.add(bottomStep);

    const bottomStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(6.42, 6.42, 0.1, 6), goldMat);
    bottomStepTrim.position.y = 0.32;
    this.group.add(bottomStepTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, 0.35, 6), creamMat);
    topStep.position.y = 0.525;
    this.group.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.42, 5.42, 0.1, 6), goldMat);
    topStepTrim.position.y = 0.67;
    this.group.add(topStepTrim);

    for (let s = 0; s < 2; s++) {
      const stepWidth = 4.2 - s * 0.4;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, 0.18, 0.9), darkCreamMat);
      stepMesh.position.set(0, 0.1 + s * 0.18, 5.8 - s * 0.6);
      this.group.add(stepMesh);

      const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(stepWidth + 0.05, 0.05, 0.95), goldMat);
      stepEdge.position.set(0, 0.18 + s * 0.18, 5.8 - s * 0.6);
      this.group.add(stepEdge);
    }

    const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 16), floorPatternMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0, 0.71, 0);
    this.group.add(floorRing);

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    const heartMesh = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), floorPatternMat);
    heartMesh.rotation.x = -Math.PI / 2;
    heartMesh.scale.set(1.2, 1.2, 1.2);
    heartMesh.position.set(0, 0.71, 0);
    this.group.add(heartMesh);

    // 2. Pillars
    const pillarRadius = 4.7;
    const pillarPositions = [];

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const px = Math.cos(angle) * pillarRadius;
      const pz = Math.sin(angle) * pillarRadius;
      pillarPositions.push({ x: px, z: pz, angle });

      const basePed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), creamMat);
      basePed.position.set(px, 1.07, pz);
      this.group.add(basePed);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.75), goldMat);
      baseTrim.position.set(px, 1.42, pz);
      this.group.add(baseTrim);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.2, 8), creamMat);
      col.position.set(px, 3.55, pz);
      this.group.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
      cap.position.set(px, 5.65, pz);
      this.group.add(cap);
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const fx = Math.cos(angle) * 6.2;
      const fz = Math.sin(angle) * 6.2;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), darkCreamMat);
      post.position.set(fx, 0.6, fz);
      this.group.add(post);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 4), goldMat);
      finial.position.set(fx, 1.1, fz);
      this.group.add(finial);
    }

    // 3. Railing Balustrade
    for (let i = 0; i < 5; i++) {
      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];
      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.z + p2.z) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

      const railGroup = new THREE.Group();
      railGroup.position.set(mx, 0, mz);
      railGroup.rotation.y = -angle;

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(dist - 0.6, 0.12, 0.18), goldMat);
      topRail.position.y = 1.9;
      railGroup.add(topRail);

      const botRail = new THREE.Mesh(new THREE.BoxGeometry(dist - 0.6, 0.1, 0.15), creamMat);
      botRail.position.y = 1.1;
      railGroup.add(botRail);

      const spindleCount = 4;
      for (let s = 1; s <= spindleCount; s++) {
        const sx = - (dist - 0.6) / 2 + (s * (dist - 0.6)) / (spindleCount + 1);
        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), creamMat);
        spindle.position.set(sx, 1.5, 0);
        railGroup.add(spindle);
      }

      this.group.add(railGroup);
    }

    // 4. Curtains
    for (let i = 0; i < 6; i++) {
      const p = pillarPositions[i];

      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.6, 8, 1, true), creamMat);
      curtain.position.set(p.x, 3.8, p.z);
      curtain.scale.set(1.1, 1, 0.7);
      curtain.rotation.y = p.angle;
      this.group.add(curtain);

      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 12), pinkRibbonMat);
      ribbon.position.set(p.x, 3.2, p.z);
      ribbon.rotation.x = Math.PI / 2;
      this.group.add(ribbon);

      const bow = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), pinkRibbonMat);
      bow.position.set(p.x * 1.08, 3.2, p.z * 1.08);
      this.group.add(bow);
    }

    // 5. Roof
    const cornice = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.6, 0.35, 6), goldMat);
    cornice.position.y = 5.85;
    this.group.add(cornice);

    const innerCornice = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.25, 6), creamMat);
    innerCornice.position.y = 6.1;
    this.group.add(innerCornice);

    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.4, 6), creamMat);
    mainRoof.position.y = 7.3;
    this.group.add(mainRoof);

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 5.4), goldMat);
      rib.rotation.y = angle;
      rib.rotation.x = Math.atan2(2.4, 5.6);
      rib.position.set(0, 7.3, 0);
      this.group.add(rib);
    }

    const upperCap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.6, 6), goldMat);
    upperCap.position.y = 8.6;
    this.group.add(upperCap);

    const upperDome = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 6), creamMat);
    upperDome.position.y = 9.2;
    this.group.add(upperDome);

    const topFinialBase = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 6), goldMat);
    topFinialBase.position.y = 9.85;
    this.group.add(topFinialBase);

    const topHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    topHeart.scale.set(0.7, 0.7, 0.7);
    topHeart.position.set(0, 10.4, 0);
    this.group.add(topHeart);

    // 6. Signboard
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 5.7, 4.6);

    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.12), goldMat);
    signGroup.add(signFrame);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.15), creamMat);
    signBoard.position.z = 0.02;
    signGroup.add(signBoard);

    const signHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    signHeart.scale.set(0.35, 0.35, 0.35);
    signHeart.position.set(0, 0.2, 0.1);
    signGroup.add(signHeart);

    this.group.add(signGroup);

    // Floral accents
    const addRoseCluster = (x, y, z, count = 3) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      for (let r = 0; r < count; r++) {
        const isPink = r % 2 === 0;
        const roseMat = isPink ? rosePinkMat : roseWhiteMat;
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.06), roseMat);
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

    pillarPositions.forEach(p => {
      addRoseCluster(p.x, 5.8, p.z, 4);
      addRoseCluster(p.x * 1.08, 3.2, p.z * 1.08, 3);
    });
    addRoseCluster(-1.3, 5.7, 4.6, 3);
    addRoseCluster(1.3, 5.7, 4.6, 3);
  }
}
