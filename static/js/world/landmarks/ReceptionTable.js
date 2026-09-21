import * as THREE from 'three';

export class ReceptionTable {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(15, 0, -15);
    this.build();
  }

  build() {
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const warmWoodMat = new THREE.MeshLambertMaterial({ color: '#e6c8a2' });
    const chairWoodMat = new THREE.MeshLambertMaterial({ color: '#9e6f47' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const roseWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const warmGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe082', emissive: 0x332200 });
    const paperWhiteMat = new THREE.MeshLambertMaterial({ color: '#fdfbf7' });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // Platform
    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.25, 8), darkCreamMat);
    baseMat.position.y = 0.125;
    this.group.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.22, 5.22, 0.08, 8), goldMat);
    baseTrim.position.y = 0.23;
    this.group.add(baseTrim);

    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 0.8), creamMat);
    stepMesh.position.set(0, 0.075, 4.2);
    this.group.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.04, 0.85), goldMat);
    stepEdge.position.set(0, 0.14, 4.2);
    this.group.add(stepEdge);

    // Desk Body
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, 0.6);

    const deskBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 1.8), creamMat);
    deskBody.position.y = 0.9;
    deskGroup.add(deskBody);

    const deskBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.1, 1.9), darkCreamMat);
    deskBaseTrim.position.y = 0.3;
    deskGroup.add(deskBaseTrim);

    const deskGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.08, 1.95), goldMat);
    deskGoldTrim.position.y = 1.48;
    deskGroup.add(deskGoldTrim);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 2.0), warmWoodMat);
    deskTop.position.y = 1.55;
    deskGroup.add(deskTop);

    const swagLeft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.1, 0.3, 8, 1, false, 0, Math.PI), pinkRibbonMat);
    swagLeft.rotation.z = -Math.PI / 2;
    swagLeft.rotation.y = Math.PI / 2;
    swagLeft.scale.set(0.6, 1.4, 0.2);
    swagLeft.position.set(-1.1, 0.95, 0.92);
    deskGroup.add(swagLeft);

    const swagRight = swagLeft.clone();
    swagRight.position.set(1.1, 0.95, 0.92);
    deskGroup.add(swagRight);

    const centerHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    centerHeart.scale.set(0.4, 0.4, 0.4);
    centerHeart.position.set(0, 0.95, 0.95);
    deskGroup.add(centerHeart);

    this.group.add(deskGroup);

    // Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0.25, -1.0);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), chairWoodMat);
    seat.position.y = 0.6;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), chairWoodMat);
    backrest.position.set(0, 1.1, -0.4);
    chairGroup.add(backrest);

    for (let lx of [-0.38, 0.38]) {
      for (let lz of [-0.38, 0.38]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), chairWoodMat);
        leg.position.set(lx, 0.3, lz);
        chairGroup.add(leg);
      }
    }
    this.group.add(chairGroup);

    // Arch Columns & Frame
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -0.6);

    for (let px of [-2.4, 2.4]) {
      const pPed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), creamMat);
      pPed.position.set(px, 0.65, 0);
      archGroup.add(pPed);

      const pPedTrim = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.75), goldMat);
      pPedTrim.position.set(px, 1.0, 0);
      archGroup.add(pPedTrim);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.4, 8), creamMat);
      col.position.set(px, 3.2, 0);
      archGroup.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
      cap.position.set(px, 5.4, 0);
      archGroup.add(cap);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), goldMat);
      finial.position.set(px, 5.7, 0);
      archGroup.add(finial);
    }

    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 0.5), creamMat);
    beam.position.y = 5.4;
    archGroup.add(beam);

    const beamTrim = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 0.55), goldMat);
    beamTrim.position.y = 5.6;
    archGroup.add(beamTrim);

    const curtain = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 12, 1, true, 0, Math.PI), paperWhiteMat);
    curtain.rotation.x = Math.PI / 2;
    curtain.position.set(0, 5.0, 0);
    archGroup.add(curtain);

    for (let lx of [-1.4, 1.4]) {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), goldMat);
      chain.position.set(lx, 4.8, 0);
      archGroup.add(chain);

      const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), goldMat);
      lanternBody.position.set(lx, 4.2, 0);
      archGroup.add(lanternBody);

      const lanternGlow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), warmGlowMat);
      lanternGlow.position.set(lx, 4.2, 0);
      archGroup.add(lanternGlow);
    }

    const signGroup = new THREE.Group();
    signGroup.position.set(0, 6.2, 0);

    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.12), goldMat);
    signGroup.add(signFrame);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.15), creamMat);
    signBoard.position.z = 0.02;
    signGroup.add(signBoard);

    const signHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    signHeart.scale.set(0.35, 0.35, 0.35);
    signHeart.position.set(0, 0.2, 0.1);
    signGroup.add(signHeart);

    archGroup.add(signGroup);
    this.group.add(archGroup);

    // Props
    const propsGroup = new THREE.Group();
    propsGroup.position.set(0, 1.6, 0.6);

    const bookLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.55), paperWhiteMat);
    bookLeft.position.set(-0.22, 0.03, 0.2);
    bookLeft.rotation.z = 0.08;
    propsGroup.add(bookLeft);

    const bookRight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.55), paperWhiteMat);
    bookRight.position.set(0.22, 0.03, 0.2);
    bookRight.rotation.z = -0.08;
    propsGroup.add(bookRight);

    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.58), goldMat);
    bookCover.position.set(0, 0.01, 0.2);
    propsGroup.add(bookCover);

    const penStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8), goldMat);
    penStand.position.set(0.65, 0.08, 0.25);
    propsGroup.add(penStand);

    const quillPen = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 0.5, 6), roseWhiteMat);
    quillPen.rotation.z = -0.3;
    quillPen.position.set(0.7, 0.3, 0.25);
    propsGroup.add(quillPen);

    const frameStand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.05), goldMat);
    frameStand.rotation.x = -0.2;
    frameStand.position.set(1.1, 0.35, -0.2);
    propsGroup.add(frameStand);

    const frameCard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.06), creamMat);
    frameCard.rotation.x = -0.2;
    frameCard.position.set(1.1, 0.35, -0.18);
    propsGroup.add(frameCard);

    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.5, 8), roseWhiteMat);
    vase.position.set(-1.1, 0.25, 0);
    propsGroup.add(vase);

    this.group.add(propsGroup);

    // Floral clusters
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

    addRoseCluster(-1.1, 2.1, 0.6, 4);
    addRoseCluster(-2.4, 5.4, -0.6, 4);
    addRoseCluster(2.4, 5.4, -0.6, 4);
    addRoseCluster(-1.4, 6.2, -0.6, 3);
    addRoseCluster(1.4, 6.2, -0.6, 3);

    for (let px of [-2.8, 2.8]) {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), creamMat);
      planter.position.set(px, 0.5, 1.2);
      this.group.add(planter);

      const planterTrim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), goldMat);
      planterTrim.position.set(px, 0.8, 1.2);
      this.group.add(planterTrim);

      addRoseCluster(px, 1.1, 1.2, 4);
    }
  }
}
