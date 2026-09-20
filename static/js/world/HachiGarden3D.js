import * as THREE from 'three';

export class HachiGarden3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.petalsMesh = null;
    this.petalPositions = [];

    this.buildTerrain();
    this.buildWeddingArch();
    this.buildLocationSignboard();
    this.buildGazebo();
    this.buildReceptionTables();
    this.buildWishingTree();
    this.buildFountainPond();
    this.buildFlowerBeds();
    this.buildPetalParticles();
  }

  buildTerrain() {
    // Grass Ground
    const grassGeo = new THREE.PlaneGeometry(120, 120);
    const grassMat = new THREE.MeshLambertMaterial({ color: '#3a5e2d' });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    this.group.add(grass);

    // Stone Path Crossroads
    const pathMat = new THREE.MeshLambertMaterial({ color: '#d4c5a9' });

    // Main Vertical Runway Path
    const vPathGeo = new THREE.PlaneGeometry(8, 80);
    const vPath = new THREE.Mesh(vPathGeo, pathMat);
    vPath.rotation.x = -Math.PI / 2;
    vPath.position.set(0, 0.02, 0);
    this.group.add(vPath);

    // Top Horizontal Path
    const hPath1Geo = new THREE.PlaneGeometry(60, 6);
    const hPath1 = new THREE.Mesh(hPath1Geo, pathMat);
    hPath1.rotation.x = -Math.PI / 2;
    hPath1.position.set(0, 0.02, -15);
    this.group.add(hPath1);

    // Bottom Horizontal Path
    const hPath2Geo = new THREE.PlaneGeometry(60, 6);
    const hPath2 = new THREE.Mesh(hPath2Geo, pathMat);
    hPath2.rotation.x = -Math.PI / 2;
    hPath2.position.set(0, 0.02, 15);
    this.group.add(hPath2);
  }

  buildWeddingArch() {
    // Entrance Archway (x: 0, z: 30)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 30);

    const pillarMat = new THREE.MeshLambertMaterial({ color: '#5c4033' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ff4d6d' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });

    // Pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7), pillarMat);
    p1.position.set(-4, 3.5, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7), pillarMat);
    p2.position.set(4, 3.5, 0);
    archGroup.add(p1);
    archGroup.add(p2);

    // Top Arch Beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 0.6), goldMat);
    beam.position.set(0, 7, 0);
    archGroup.add(beam);

    // Floral Clusters
    for (let i = -4; i <= 4; i += 1.5) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), flowerMat);
      flower.position.set(i, 7.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.5);
      archGroup.add(flower);
    }

    this.group.add(archGroup);
  }

  buildGazebo() {
    // Gazebo at Couple Zone (x: -15, z: -15)
    const gazebo = new THREE.Group();
    gazebo.position.set(-15, 0, -15);

    // Color Palette Materials (Lambert for cozy soft shading, performance friendly)
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const roseWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const floorPatternMat = new THREE.MeshLambertMaterial({ color: '#d99b9b', side: THREE.DoubleSide });

    // 1. Double-Stepped Hexagonal Base Platform
    const bottomStep = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.7, 0.35, 6), darkCreamMat);
    bottomStep.position.y = 0.175;
    gazebo.add(bottomStep);

    const bottomStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(6.42, 6.42, 0.1, 6), goldMat);
    bottomStepTrim.position.y = 0.32;
    gazebo.add(bottomStepTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, 0.35, 6), creamMat);
    topStep.position.y = 0.525;
    gazebo.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.42, 5.42, 0.1, 6), goldMat);
    topStepTrim.position.y = 0.67;
    gazebo.add(topStepTrim);

    // Platform Front Steps (Entrance at +Z)
    for (let s = 0; s < 2; s++) {
      const stepWidth = 4.2 - s * 0.4;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, 0.18, 0.9), darkCreamMat);
      stepMesh.position.set(0, 0.1 + s * 0.18, 5.8 - s * 0.6);
      gazebo.add(stepMesh);

      const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(stepWidth + 0.05, 0.05, 0.95), goldMat);
      stepEdge.position.set(0, 0.18 + s * 0.18, 5.8 - s * 0.6);
      gazebo.add(stepEdge);
    }

    // Floor Inlay Ring & Emblem
    const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 16), floorPatternMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0, 0.71, 0);
    gazebo.add(floorRing);

    // Floor Heart Icon (procedural mesh shape)
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
    gazebo.add(heartMesh);

    // 2. Pillars & Bases (6 Corner Columns)
    const pillarRadius = 4.7;
    const pillarPositions = [];

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const px = Math.cos(angle) * pillarRadius;
      const pz = Math.sin(angle) * pillarRadius;
      pillarPositions.push({ x: px, z: pz, angle });

      // Pillar Base Pedestal
      const basePed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), creamMat);
      basePed.position.set(px, 1.07, pz);
      gazebo.add(basePed);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.75), goldMat);
      baseTrim.position.set(px, 1.42, pz);
      gazebo.add(baseTrim);

      // Main Column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.2, 8), creamMat);
      col.position.set(px, 3.55, pz);
      gazebo.add(col);

      // Column Capital / Top Trim
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
      cap.position.set(px, 5.65, pz);
      gazebo.add(cap);
    }

    // Outer Base Post Finials
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const fx = Math.cos(angle) * 6.2;
      const fz = Math.sin(angle) * 6.2;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), darkCreamMat);
      post.position.set(fx, 0.6, fz);
      gazebo.add(post);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 4), goldMat);
      finial.position.set(fx, 1.1, fz);
      gazebo.add(finial);
    }

    // 3. Low-Poly Railing Balustrade (5 Sides, leaving front entrance open)
    for (let i = 0; i < 5; i++) {
      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];
      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.z + p2.z) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

      // Railing Top & Bottom Beams
      const railGroup = new THREE.Group();
      railGroup.position.set(mx, 0, mz);
      railGroup.rotation.y = -angle;

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(dist - 0.6, 0.12, 0.18), goldMat);
      topRail.position.y = 1.9;
      railGroup.add(topRail);

      const botRail = new THREE.Mesh(new THREE.BoxGeometry(dist - 0.6, 0.1, 0.15), creamMat);
      botRail.position.y = 1.1;
      railGroup.add(botRail);

      // Vertical Spindles
      const spindleCount = 4;
      for (let s = 1; s <= spindleCount; s++) {
        const sx = - (dist - 0.6) / 2 + (s * (dist - 0.6)) / (spindleCount + 1);
        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), creamMat);
        spindle.position.set(sx, 1.5, 0);
        railGroup.add(spindle);
      }

      gazebo.add(railGroup);
    }

    // 4. Fabric Curtains (Curved Drapes wrapping columns)
    for (let i = 0; i < 6; i++) {
      const p = pillarPositions[i];

      // Draped Curtain Body
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.6, 8, 1, true), creamMat);
      curtain.position.set(p.x, 3.8, p.z);
      curtain.scale.set(1.1, 1, 0.7);
      curtain.rotation.y = p.angle;
      gazebo.add(curtain);

      // Ribbon Tie
      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 12), pinkRibbonMat);
      ribbon.position.set(p.x, 3.2, p.z);
      ribbon.rotation.x = Math.PI / 2;
      gazebo.add(ribbon);

      // Ribbon Bow Knot
      const bow = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), pinkRibbonMat);
      bow.position.set(p.x * 1.05, 3.2, p.z * 1.05);
      gazebo.add(bow);
    }

    // 5. Canopy Roof Architecture
    // Roof Cornice Gold Band
    const cornice = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.6, 0.35, 6), goldMat);
    cornice.position.y = 5.85;
    gazebo.add(cornice);

    const innerCornice = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.25, 6), creamMat);
    innerCornice.position.y = 6.1;
    gazebo.add(innerCornice);

    // Main Hexagonal Pagoda Roof
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.4, 6), creamMat);
    mainRoof.position.y = 7.3;
    gazebo.add(mainRoof);

    // Gold Roof Ribs along the 6 Hexagon Edges
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 5.4), goldMat);
      rib.rotation.y = angle;
      rib.rotation.x = Math.atan2(2.4, 5.6);
      rib.position.set(0, 7.3, 0);
      gazebo.add(rib);
    }

    // Upper Roof Dome / Cap
    const upperCap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.6, 6), goldMat);
    upperCap.position.y = 8.6;
    gazebo.add(upperCap);

    const upperDome = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 6), creamMat);
    upperDome.position.y = 9.2;
    gazebo.add(upperDome);

    // Top Golden Heart Finial
    const topFinialBase = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 6), goldMat);
    topFinialBase.position.y = 9.85;
    gazebo.add(topFinialBase);

    const topHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    topHeart.scale.set(0.7, 0.7, 0.7);
    topHeart.position.set(0, 10.4, 0);
    gazebo.add(topHeart);

    // 6. Signboard Banner "Together Always" / Entrance Arch Sign
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

    gazebo.add(signGroup);

    // 7. Roses & Floral Clusters (Pillar tops, curtain ties, and base posts)
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
      gazebo.add(cluster);
    };

    // Add roses to each pillar top & ribbon tie
    pillarPositions.forEach(p => {
      addRoseCluster(p.x, 5.8, p.z, 4);
      addRoseCluster(p.x * 1.08, 3.2, p.z * 1.08, 3);
    });

    // Add roses around entrance signboard
    addRoseCluster(-1.3, 5.7, 4.6, 3);
    addRoseCluster(1.3, 5.7, 4.6, 3);

    this.group.add(gazebo);
  }

  buildReceptionTables() {
    // RSVP Check-in Desk Landmark at RSVP Zone (x: 15, z: -15)
    const reception = new THREE.Group();
    reception.position.set(15, 0, -15);

    // Color Palette Materials
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

    // Procedural Heart Shape for Emblems
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // 1. Base Platform & Floor Mat
    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.25, 8), darkCreamMat);
    baseMat.position.y = 0.125;
    reception.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.22, 5.22, 0.08, 8), goldMat);
    baseTrim.position.y = 0.23;
    reception.add(baseTrim);

    // Front Entrance Step
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 0.8), creamMat);
    stepMesh.position.set(0, 0.075, 4.2);
    reception.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.04, 0.85), goldMat);
    stepEdge.position.set(0, 0.14, 4.2);
    reception.add(stepEdge);

    // 2. Main Reception Desk Body
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, 0.6);

    // Main Desk Counter Box
    const deskBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 1.8), creamMat);
    deskBody.position.y = 0.9;
    deskGroup.add(deskBody);

    // Desk Base Trim & Top Edge Gold Molding
    const deskBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.1, 1.9), darkCreamMat);
    deskBaseTrim.position.y = 0.3;
    deskGroup.add(deskBaseTrim);

    const deskGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.08, 1.95), goldMat);
    deskGoldTrim.position.y = 1.48;
    deskGroup.add(deskGoldTrim);

    // Warm Oak Desk Surface
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 2.0), warmWoodMat);
    deskTop.position.y = 1.55;
    deskGroup.add(deskTop);

    // Front Desk Draped Fabric Swag with Center Gold Heart Emblem
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

    reception.add(deskGroup);

    // 3. Reception Chair (Behind Desk)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0.25, -1.0);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), chairWoodMat);
    seat.position.y = 0.6;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), chairWoodMat);
    backrest.position.set(0, 1.1, -0.4);
    chairGroup.add(backrest);

    // Chair Legs
    for (let lx of [-0.38, 0.38]) {
      for (let lz of [-0.38, 0.38]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), chairWoodMat);
        leg.position.set(lx, 0.3, lz);
        chairGroup.add(leg);
      }
    }
    reception.add(chairGroup);

    // 4. Backdrop Arch Columns & Frame
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -0.6);

    // Side Pillars
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

    // Top Beam Header
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 0.5), creamMat);
    beam.position.y = 5.4;
    archGroup.add(beam);

    const beamTrim = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 0.55), goldMat);
    beamTrim.position.y = 5.6;
    archGroup.add(beamTrim);

    // Draped Fabric Canopy under Header
    const curtain = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 12, 1, true, 0, Math.PI), paperWhiteMat);
    curtain.rotation.x = Math.PI / 2;
    curtain.position.set(0, 5.0, 0);
    archGroup.add(curtain);

    // Hanging Warm Lanterns (Left & Right)
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

    // 5. RSVP Crest Signboard ("RSVP Check-In")
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
    reception.add(archGroup);

    // 6. Desk Props (Open Guestbook, Pen Stand, Signboard Frame, Flower Vase)
    const propsGroup = new THREE.Group();
    propsGroup.position.set(0, 1.6, 0.6);

    // Open Guestbook
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

    // Quill Pen & Stand
    const penStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8), goldMat);
    penStand.position.set(0.65, 0.08, 0.25);
    propsGroup.add(penStand);

    const quillPen = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 0.5, 6), roseWhiteMat);
    quillPen.rotation.z = -0.3;
    quillPen.position.set(0.7, 0.3, 0.25);
    propsGroup.add(quillPen);

    // Small Guestbook Sign Easel Frame ("Please Sign Our Guestbook")
    const frameStand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.05), goldMat);
    frameStand.rotation.x = -0.2;
    frameStand.position.set(1.1, 0.35, -0.2);
    propsGroup.add(frameStand);

    const frameCard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.06), creamMat);
    frameCard.rotation.x = -0.2;
    frameCard.position.set(1.1, 0.35, -0.18);
    propsGroup.add(frameCard);

    // Floral Vase on Desk (Left side)
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.5, 8), roseWhiteMat);
    vase.position.set(-1.1, 0.25, 0);
    propsGroup.add(vase);

    reception.add(propsGroup);

    // 7. Roses & Foliage Clusters
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
      reception.add(cluster);
    };

    // Add roses to desk vase, arch tops, and floor planters
    addRoseCluster(-1.1, 2.1, 0.6, 4); // On desk vase
    addRoseCluster(-2.4, 5.4, -0.6, 4); // Left arch corner
    addRoseCluster(2.4, 5.4, -0.6, 4);  // Right arch corner
    addRoseCluster(-1.4, 6.2, -0.6, 3); // Signboard left
    addRoseCluster(1.4, 6.2, -0.6, 3);  // Signboard right

    // Side Floor Planters
    for (let px of [-2.8, 2.8]) {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), creamMat);
      planter.position.set(px, 0.5, 1.2);
      reception.add(planter);

      const planterTrim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), goldMat);
      planterTrim.position.set(px, 0.8, 1.2);
      reception.add(planterTrim);

      addRoseCluster(px, 1.1, 1.2, 4);
    }

    this.group.add(reception);
  }

  buildWishingTree() {
    // Sprint 3: Wishes Sakura Tree Landmark at Wishes Zone (x: -12, z: 15)
    const tree = new THREE.Group();
    tree.position.set(-12, 0, 15);

    // Color Palette Materials
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

    // Procedural Heart Shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // 1. Octagonal Podium Base
    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.3, 8), darkCreamMat);
    baseMat.position.y = 0.15;
    tree.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.22, 5.22, 0.08, 8), goldMat);
    baseTrim.position.y = 0.29;
    tree.add(baseTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.3, 8), creamMat);
    topStep.position.y = 0.44;
    tree.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.42, 4.42, 0.08, 8), goldMat);
    topStepTrim.position.y = 0.58;
    tree.add(topStepTrim);

    // Front Steps (-Z toward path)
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.8), darkCreamMat);
    stepMesh.position.set(0, 0.1, -4.8);
    tree.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.05, 0.85), goldMat);
    stepEdge.position.set(0, 0.18, -4.8);
    tree.add(stepEdge);

    // Floor Inlay Ring & Emblem
    const floorRing = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.2, 16), floorPatternMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0, 0.6, 0);
    tree.add(floorRing);

    const heartMesh = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), floorPatternMat);
    heartMesh.rotation.x = -Math.PI / 2;
    heartMesh.scale.set(1.0, 1.0, 1.0);
    heartMesh.position.set(0, 0.6, 0);
    tree.add(heartMesh);

    // 2. Outer Balustrade Railing (7 Sides, front open)
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const rx = Math.cos(angle) * 4.2;
      const rz = Math.sin(angle) * 4.2;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.45), creamMat);
      post.position.set(rx, 0.95, rz);
      tree.add(post);

      const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), goldMat);
      postCap.position.set(rx, 1.45, rz);
      tree.add(postCap);
    }

    // Railing Horizontal Bars & Heart Cutouts
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

      tree.add(barGroup);
    }

    // 3. Organic Twisted Sakura Tree Trunk
    const trunkGroup = new THREE.Group();
    trunkGroup.position.set(0, 0.6, 0);

    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 2.2, 8), barkWoodMat);
    trunkBase.position.y = 1.1;
    trunkGroup.add(trunkBase);

    const trunkMid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.5, 8), barkWoodMat);
    trunkMid.position.set(0.2, 3.2, -0.1);
    trunkMid.rotation.z = -0.15;
    trunkGroup.add(trunkMid);

    // Carved Trunk Heart Detail
    const trunkHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    trunkHeart.scale.set(0.5, 0.5, 0.5);
    trunkHeart.position.set(0.45, 2.8, 0.6);
    trunkHeart.rotation.y = 0.3;
    trunkGroup.add(trunkHeart);

    // Trunk Fabric Ribbon Wrap
    const ribbonWrap = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 16), pinkRibbonMat);
    ribbonWrap.rotation.x = Math.PI / 3;
    ribbonWrap.position.set(0.1, 2.5, 0.1);
    trunkGroup.add(ribbonWrap);

    // Major Branches
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

    tree.add(trunkGroup);

    // 4. Layered Lush Sakura Canopy (Blossom Clusters)
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
    tree.add(canopyGroup);

    // 5. Hanging Wish Cards with Gold Strings & Tassels
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

      // Gold String
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6), goldMat);
      string.position.y = 0.3;
      cardGroup.add(string);

      // Wish Card
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.02), cardCreamMat);
      cardGroup.add(card);

      const cardHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      cardHeart.scale.set(0.12, 0.12, 0.12);
      cardHeart.position.set(0, 0.05, 0.02);
      cardGroup.add(cardHeart);

      // Bottom Pink Tassel
      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.25), pinkRibbonMat);
      tassel.position.y = -0.32;
      cardGroup.add(tassel);

      tree.add(cardGroup);
    });

    // 6. Base Rose & Flower Planters
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
      tree.add(cluster);
    };

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const fx = Math.cos(angle) * 3.2;
      const fz = Math.sin(angle) * 3.2;
      addRoseCluster(fx, 0.75, fz, 3);
    }

    this.group.add(tree);
  }

  buildLocationSignboard() {
    // Sprint 4: Wedding Location Signboard Landmark at Location Zone (x: 0, z: 18)
    const sign = new THREE.Group();
    sign.position.set(0, 0, 18);

    // Color Palette Materials
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const roseWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const boardBgMat = new THREE.MeshLambertMaterial({ color: '#faf6ee' });
    const mapGreenMat = new THREE.MeshLambertMaterial({ color: '#88b04b' });

    // Procedural Heart Shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // 1. Pedestal Base Posts & Connecting Arch
    for (let px of [-2.2, 2.2]) {
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.85), creamMat);
      pBase.position.set(px, 0.45, 0);
      sign.add(pBase);

      const pBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), goldMat);
      pBaseTrim.position.set(px, 0.9, 0);
      sign.add(pBaseTrim);

      const heartDeco = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      heartDeco.scale.set(0.3, 0.3, 0.3);
      heartDeco.position.set(px, 0.45, 0.44);
      sign.add(heartDeco);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 8), creamMat);
      col.position.set(px, 3.2, 0);
      sign.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
      cap.position.set(px, 5.45, 0);
      sign.add(cap);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), goldMat);
      finial.position.set(px, 5.8, 0);
      sign.add(finial);
    }

    // Lower Gold Connecting Arch
    const lowerArch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 16, Math.PI), goldMat);
    lowerArch.position.set(0, 0.9, 0);
    sign.add(lowerArch);

    const archHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
    archHeart.scale.set(0.35, 0.35, 0.35);
    archHeart.position.set(0, 0.9, 0.05);
    sign.add(archHeart);

    // 2. Main Welcome Map Board Frame
    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 3.3, 0);

    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.15), goldMat);
    boardGroup.add(outerFrame);

    const innerBoard = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.0, 0.18), boardBgMat);
    innerBoard.position.z = 0.02;
    boardGroup.add(innerBoard);

    // Left Side: Mini Map Graphic Preview
    const miniMapBg = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.2), mapGreenMat);
    miniMapBg.position.set(-0.95, 0, 0.03);
    boardGroup.add(miniMapBg);

    // Map Path Lines
    const mapPath = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.22), darkCreamMat);
    mapPath.rotation.z = 0.3;
    mapPath.position.set(-0.95, -0.2, 0.04);
    boardGroup.add(mapPath);

    // Map Pin Icon
    const mapPin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), rosePinkMat);
    mapPin.rotation.x = Math.PI;
    mapPin.position.set(-0.95, 0.4, 0.16);
    boardGroup.add(mapPin);

    // Right Side: Directional Schedule List Items
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

    sign.add(boardGroup);

    // 3. Top Header Crest ("Our Wedding Welcome")
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

    sign.add(headerGroup);

    // 4. Fabric Curtains & Rose Clusters
    for (let px of [-2.2, 2.2]) {
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8, 1, true), creamMat);
      curtain.position.set(px, 3.2, 0);
      curtain.scale.set(1.0, 1.0, 0.6);
      sign.add(curtain);

      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12), pinkRibbonMat);
      ribbon.position.set(px, 2.6, 0);
      ribbon.rotation.x = Math.PI / 2;
      sign.add(ribbon);
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
      sign.add(cluster);
    };

    addRoseCluster(-2.2, 5.4, 0.2, 4);
    addRoseCluster(2.2, 5.4, 0.2, 4);
    addRoseCluster(-1.6, 5.9, 0.2, 3);
    addRoseCluster(1.6, 5.9, 0.2, 3);
    addRoseCluster(-2.2, 0.9, 0.4, 3);
    addRoseCluster(2.2, 0.9, 0.4, 3);

    this.group.add(sign);
  }

  buildFountainPond() {
    // Sprint 5: Gift Fountain / Table Landmark at Gift Zone (x: 12, z: 15)
    const fountain = new THREE.Group();
    fountain.position.set(12, 0, 15);

    // Color Palette Materials
    const creamMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const darkCreamMat = new THREE.MeshLambertMaterial({ color: '#eee3d3' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const pinkRibbonMat = new THREE.MeshLambertMaterial({ color: '#e8a5b0' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });
    const roseWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const waterBlueMat = new THREE.MeshLambertMaterial({ color: '#4ba3e3', opacity: 0.85, transparent: true });

    // Procedural Heart Shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.5, -0.6, 0.7, -0.6, 0.2);
    heartShape.bezierCurveTo(-0.6, -0.2, 0, -0.5, 0, -0.8);
    heartShape.bezierCurveTo(0, -0.5, 0.6, -0.2, 0.6, 0.2);
    heartShape.bezierCurveTo(0.6, 0.7, 0, 0.5, 0, 0.2);

    // 1. Octagonal Base Podium Platform
    const baseMat = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, 0.3, 8), darkCreamMat);
    baseMat.position.y = 0.15;
    fountain.add(baseMat);

    const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.42, 5.42, 0.08, 8), goldMat);
    baseTrim.position.y = 0.29;
    fountain.add(baseTrim);

    const topStep = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 0.3, 8), creamMat);
    topStep.position.y = 0.44;
    fountain.add(topStep);

    const topStepTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.62, 4.62, 0.08, 8), goldMat);
    topStepTrim.position.y = 0.58;
    fountain.add(topStepTrim);

    // Entrance Steps (-Z toward path)
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.8), darkCreamMat);
    stepMesh.position.set(0, 0.1, -4.8);
    fountain.add(stepMesh);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.05, 0.85), goldMat);
    stepEdge.position.set(0, 0.18, -4.8);
    fountain.add(stepEdge);

    // 2. Outer Stone Pool Basin & Water Surface
    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.8, 8), creamMat);
    outerBasin.position.y = 0.98;
    fountain.add(outerBasin);

    const outerBasinTrim = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.65, 0.1, 8), goldMat);
    outerBasinTrim.position.y = 1.38;
    fountain.add(outerBasinTrim);

    const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.1, 8), waterBlueMat);
    waterSurface.position.y = 1.3;
    fountain.add(waterSurface);

    // 3. Middle Tier Pedestal & Water Spouts
    const midPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.7, 8), creamMat);
    midPedestal.position.y = 1.73;
    fountain.add(midPedestal);

    const midPedTrim = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.08, 8), goldMat);
    midPedTrim.position.y = 2.08;
    fountain.add(midPedTrim);

    const midWater = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 8), waterBlueMat);
    midWater.position.y = 2.05;
    fountain.add(midWater);

    // Gold Spout Hearts & Water Jets
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const sx = Math.cos(angle) * 1.65;
      const sz = Math.sin(angle) * 1.65;

      const spoutHeart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), goldMat);
      spoutHeart.scale.set(0.25, 0.25, 0.25);
      spoutHeart.position.set(sx, 1.9, sz);
      spoutHeart.rotation.y = -angle + Math.PI / 2;
      fountain.add(spoutHeart);

      // Water stream jet
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.8), waterBlueMat);
      jet.position.set(sx * 1.2, 1.5, sz * 1.2);
      jet.rotation.x = Math.PI / 6;
      jet.rotation.y = angle;
      fountain.add(jet);
    }

    // 4. Central Luxury Wedding Gift Chest (Digital Gift Box)
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

    // Gift Envelope Card Slot
    const cardSlot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.1), goldMat);
    cardSlot.position.set(0, 1.22, 0);
    giftChestGroup.add(cardSlot);

    // Big Pink Ribbon & Bow Knot on Chest
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.25, 1.42), pinkRibbonMat);
    ribbonV.position.y = 0.6;
    giftChestGroup.add(ribbonV);

    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.25, 0.3), pinkRibbonMat);
    ribbonH.position.y = 0.6;
    giftChestGroup.add(ribbonH);

    const bowKnot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), pinkRibbonMat);
    bowKnot.position.set(0, 1.4, 0);
    giftChestGroup.add(bowKnot);

    fountain.add(giftChestGroup);

    // 5. Overhead Floral Arch & "Gifts" Crest Banner
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

    // Overhead Arch Frame
    const archBeam = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 6, 16, Math.PI), goldMat);
    archBeam.position.set(0, 5.8, -0.5);
    archGroup.add(archBeam);

    // Gold Crest Signboard ("Gifts")
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
    fountain.add(archGroup);

    // 6. Side Posts & Flower Pots
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
      fountain.add(cluster);
    };

    for (let px of [-3.8, 3.8]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8), creamMat);
      pot.position.set(px, 0.9, 1.2);
      fountain.add(pot);

      addRoseCluster(px, 1.4, 1.2, 4);
    }

    addRoseCluster(-2.4, 5.8, -0.5, 4);
    addRoseCluster(2.4, 5.8, -0.5, 4);
    addRoseCluster(0, 2.1, 1.5, 3);
    addRoseCluster(0, 2.1, -1.5, 3);

    this.group.add(fountain);
  }

  buildFlowerBeds() {
    const flowerColors = ['#ff4d6d', '#ffb703', '#9d4edd', '#ffffff'];
    const pathMargin = 5;

    for (let i = 0; i < 30; i++) {
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const mat = new THREE.MeshLambertMaterial({ color });
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2), mat);

      let x = (Math.random() - 0.5) * 50;
      let z = (Math.random() - 0.5) * 50;

      // Keep flowers off main stone paths
      if (Math.abs(x) < pathMargin && Math.abs(z) < 25) x += 8;

      flower.position.set(x, 0.3, z);
      this.group.add(flower);
    }
  }

  buildPetalParticles() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 12 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: '#ff8fa3',
      size: 0.3,
      transparent: true,
      opacity: 0.8
    });

    this.petalsMesh = new THREE.Points(geometry, material);
    this.group.add(this.petalsMesh);

    // Sunlight Gold Dust Particles
    const dustCount = 40;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 40;
      dustPos[i * 3 + 1] = Math.random() * 8 + 0.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: '#ffe082',
      size: 0.25,
      transparent: true,
      opacity: 0.7
    });

    this.dustMesh = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustMesh);

    this.buildButterflies();
  }

  buildButterflies() {
    this.butterflies = [];
    const butterflyColors = ['#ffb7c5', '#ffd166', '#a0c4ff'];

    for (let i = 0; i < 3; i++) {
      const bGroup = new THREE.Group();
      const wingMat = new THREE.MeshLambertMaterial({
        color: butterflyColors[i],
        side: THREE.DoubleSide
      });

      // Left & Right Wings
      const wingGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        -0.3, 0.4, 0,
        -0.4, 0.1, 0,
        0, 0, 0,
        0.3, 0.4, 0,
        0.4, 0.1, 0
      ]);
      wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

      const wings = new THREE.Mesh(wingGeo, wingMat);
      bGroup.add(wings);

      // Random Initial Trajectory
      const angle = (i * Math.PI * 2) / 3;
      bGroup.position.set(Math.cos(angle) * 8, 2.5 + i * 0.5, Math.sin(angle) * 8);
      this.group.add(bGroup);

      this.butterflies.push({
        mesh: bGroup,
        wings: wings,
        baseAngle: angle,
        speed: 0.02 + i * 0.005,
        time: i * 10
      });
    }
  }

  update() {
    this.animTime = (this.animTime || 0) + 0.03;

    // 1. Animate Petal Particles Drifting Slowly
    if (this.petalsMesh) {
      const positions = this.petalsMesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.03; // Fall speed
        positions[i] += Math.sin(positions[i + 1]) * 0.01; // Sway

        if (positions[i + 1] < 0) {
          positions[i + 1] = 12;
        }
      }
      this.petalsMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate Sunlight Gold Dust Particles
    if (this.dustMesh) {
      const positions = this.dustMesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(this.animTime + i) * 0.005;
        positions[i] += Math.cos(this.animTime + i) * 0.003;
      }
      this.dustMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Animate Fluttering Butterflies
    if (this.butterflies) {
      this.butterflies.forEach(b => {
        b.time += b.speed;
        const radius = 10 + Math.sin(b.time * 2) * 3;
        b.mesh.position.x = Math.cos(b.time) * radius;
        b.mesh.position.z = Math.sin(b.time) * radius;
        b.mesh.position.y = 2.5 + Math.sin(b.time * 4) * 0.6;
        b.mesh.rotation.y = -b.time + Math.PI / 2;

        // Wing Flapping Animation
        const flap = Math.sin(b.time * 25) * 0.6;
        b.wings.scale.x = 0.5 + Math.abs(flap);
      });
    }
  }
}
