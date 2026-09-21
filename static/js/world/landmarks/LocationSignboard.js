import * as THREE from 'three';

export class LocationSignboard {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 18);
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
    const boardBgMat = new THREE.MeshLambertMaterial({ color: '#faf6ee' });
    const mapGreenMat = new THREE.MeshLambertMaterial({ color: '#88b04b' });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    for (let px of [-2.2, 2.2]) {
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.85), creamMat);
      pBase.position.set(px, 0.45, 0);
      this.group.add(pBase);

      const pBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), goldMat);
      pBaseTrim.position.set(px, 0.9, 0);
      this.group.add(pBaseTrim);

      const heartDeco = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      heartDeco.scale.set(0.3, 0.3, 0.3);
      heartDeco.position.set(px, 0.45, 0.44);
      this.group.add(heartDeco);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 8), creamMat);
      col.position.set(px, 3.2, 0);
      this.group.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
      cap.position.set(px, 5.45, 0);
      this.group.add(cap);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), goldMat);
      finial.position.set(px, 5.8, 0);
      this.group.add(finial);
    }

    const lowerArch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 16, Math.PI), goldMat);
    lowerArch.position.set(0, 0.9, 0);
    this.group.add(lowerArch);

    const archHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    archHeart.scale.set(0.35, 0.35, 0.35);
    archHeart.position.set(0, 0.9, 0.05);
    this.group.add(archHeart);

    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 3.3, 0);

    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.15), goldMat);
    boardGroup.add(outerFrame);

    const innerBoard = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.0, 0.18), boardBgMat);
    innerBoard.position.z = 0.02;
    boardGroup.add(innerBoard);

    const miniMapBg = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.2), mapGreenMat);
    miniMapBg.position.set(-0.95, 0, 0.03);
    boardGroup.add(miniMapBg);

    const mapPath = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.22), darkCreamMat);
    mapPath.rotation.z = 0.3;
    mapPath.position.set(-0.95, -0.2, 0.04);
    boardGroup.add(mapPath);

    const mapPin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), rosePinkMat);
    mapPin.rotation.x = Math.PI;
    mapPin.position.set(-0.95, 0.4, 0.16);
    boardGroup.add(mapPin);

    for (let r = 0; r < 4; r++) {
      const ry = 0.7 - r * 0.5;

      const itemBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.2), darkCreamMat);
      itemBar.position.set(0.95, ry, 0.03);
      boardGroup.add(itemBar);

      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 3), goldMat);
      arrow.rotation.z = -Math.PI / 2;
      arrow.position.set(1.6, ry, 0.15);
      boardGroup.add(arrow);
    }

    this.group.add(boardGroup);

    const headerGroup = new THREE.Group();
    headerGroup.position.set(0, 5.4, 0);

    const headerFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 0.15), goldMat);
    headerGroup.add(headerFrame);

    const headerBoard = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.18), creamMat);
    headerBoard.position.z = 0.02;
    headerGroup.add(headerBoard);

    const headerHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    headerHeart.scale.set(0.4, 0.4, 0.4);
    headerHeart.position.set(0, 0.65, 0.1);
    headerGroup.add(headerHeart);

    this.group.add(headerGroup);

    for (let px of [-2.2, 2.2]) {
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8, 1, true), creamMat);
      curtain.position.set(px, 3.2, 0);
      curtain.scale.set(1.0, 1.0, 0.6);
      this.group.add(curtain);

      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12), pinkRibbonMat);
      ribbon.position.set(px, 2.6, 0);
      ribbon.rotation.x = Math.PI / 2;
      this.group.add(ribbon);
    }

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

    addRoseCluster(-2.2, 5.4, 0.2, 4);
    addRoseCluster(2.2, 5.4, 0.2, 4);
    addRoseCluster(-1.6, 5.9, 0.2, 3);
    addRoseCluster(1.6, 5.9, 0.2, 3);
    addRoseCluster(-2.2, 0.9, 0.4, 3);
    addRoseCluster(2.2, 0.9, 0.4, 3);
  }
}
