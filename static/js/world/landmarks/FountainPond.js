import * as THREE from 'three';

export class FountainPond {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(12, 0, 15);
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
    const waterBlueMat = new THREE.MeshLambertMaterial({ color: '#4ba3e3', opacity: 0.85, transparent: true });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, 0.3, 8), darkCreamMat);
    baseMat.position.y = 0.15;
    this.group.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.42, 5.42, 0.08, 8), goldMat);
    baseTrim.position.y = 0.29;
    this.group.add(baseTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 0.3, 8), creamMat);
    topStep.position.y = 0.44;
    this.group.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.62, 4.62, 0.08, 8), goldMat);
    topStepTrim.position.y = 0.58;
    this.group.add(topStepTrim);

    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.8), darkCreamMat);
    stepMesh.position.set(0, 0.1, -4.8);
    this.group.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.05, 0.85), goldMat);
    stepEdge.position.set(0, 0.18, -4.8);
    this.group.add(stepEdge);

    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.8, 8), creamMat);
    outerBasin.position.y = 0.98;
    this.group.add(outerBasin);

    const outerBasinTrim = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.65, 0.1, 8), goldMat);
    outerBasinTrim.position.y = 1.38;
    this.group.add(outerBasinTrim);

    const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.1, 8), waterBlueMat);
    waterSurface.position.y = 1.3;
    this.group.add(waterSurface);

    const midPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.7, 8), creamMat);
    midPedestal.position.y = 1.73;
    this.group.add(midPedestal);

    const midPedTrim = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.08, 8), goldMat);
    midPedTrim.position.y = 2.08;
    this.group.add(midPedTrim);

    const midWater = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 8), waterBlueMat);
    midWater.position.y = 2.05;
    this.group.add(midWater);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const sx = Math.cos(angle) * 1.65;
      const sz = Math.sin(angle) * 1.65;

      const spoutHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      spoutHeart.scale.set(0.25, 0.25, 0.25);
      spoutHeart.position.set(sx, 1.9, sz);
      spoutHeart.rotation.y = -angle + Math.PI / 2;
      this.group.add(spoutHeart);

      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.8), waterBlueMat);
      jet.position.set(sx * 1.2, 1.5, sz * 1.2);
      jet.rotation.x = Math.PI / 6;
      jet.rotation.y = angle;
      this.group.add(jet);
    }

    const giftChestGroup = new THREE.Group();
    giftChestGroup.position.set(0, 2.65, 0);

    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), creamMat);
    chestBody.position.y = 0.6;
    giftChestGroup.add(chestBody);

    const chestBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.45), goldMat);
    chestBaseTrim.position.y = 0.04;
    giftChestGroup.add(chestBaseTrim);

    const chestTopTrim = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.45), goldMat);
    chestTopTrim.position.y = 1.18;
    giftChestGroup.add(chestTopTrim);

    const chestHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    chestHeart.scale.set(0.45, 0.45, 0.45);
    chestHeart.position.set(0, 0.6, 0.72);
    giftChestGroup.add(chestHeart);

    const cardSlot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.1), goldMat);
    cardSlot.position.set(0, 1.22, 0);
    giftChestGroup.add(cardSlot);

    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.25, 1.42), pinkRibbonMat);
    ribbonV.position.y = 0.6;
    giftChestGroup.add(ribbonV);

    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.25, 0.3), pinkRibbonMat);
    ribbonH.position.y = 0.6;
    giftChestGroup.add(ribbonH);

    const bowKnot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), pinkRibbonMat);
    bowKnot.position.set(0, 1.4, 0);
    giftChestGroup.add(bowKnot);

    this.group.add(giftChestGroup);

    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 0);

    for (let px of [-2.4, 2.4]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.2, 8), creamMat);
      col.position.set(px, 3.2, -0.5);
      archGroup.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.55), goldMat);
      cap.position.set(px, 5.8, -0.5);
      archGroup.add(cap);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 4), goldMat);
      finial.position.set(px, 6.1, -0.5);
      archGroup.add(finial);

      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8, 1, true), creamMat);
      curtain.position.set(px, 3.6, -0.5);
      curtain.scale.set(1.0, 1.0, 0.6);
      archGroup.add(curtain);

      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12), pinkRibbonMat);
      ribbon.position.set(px, 3.0, -0.5);
      ribbon.rotation.x = Math.PI / 2;
      archGroup.add(ribbon);
    }

    const archBeam = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 6, 16, Math.PI), goldMat);
    archBeam.position.set(0, 5.8, -0.5);
    archGroup.add(archBeam);

    const signGroup = new THREE.Group();
    signGroup.position.set(0, 6.4, -0.5);

    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.12), goldMat);
    signGroup.add(signFrame);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 0.15), creamMat);
    signBoard.position.z = 0.02;
    signGroup.add(signBoard);

    const signHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    signHeart.scale.set(0.35, 0.35, 0.35);
    signHeart.position.set(0, 0.55, 0.1);
    signGroup.add(signHeart);

    archGroup.add(signGroup);
    this.group.add(archGroup);

    const addRoseCluster = (x, y, z, count = 3) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      for (let r = 0; r < count; r++) {
        const isPink = r % 2 === 0;
        const roseMat = isPink ? rosePinkMat : roseWhiteMat;
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

    for (let px of [-3.8, 3.8]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8), creamMat);
      pot.position.set(px, 0.9, 1.2);
      this.group.add(pot);

      addRoseCluster(px, 1.4, 1.2, 4);
    }

    addRoseCluster(-2.4, 5.8, -0.5, 4);
    addRoseCluster(2.4, 5.8, -0.5, 4);
    addRoseCluster(0, 2.1, 1.5, 3);
    addRoseCluster(0, 2.1, -1.5, 3);
  }
}
