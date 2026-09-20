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
    // Wishing Sakura Tree at Wishes Zone (x: -12, z: 15)
    const tree = new THREE.Group();
    tree.position.set(-12, 0, 15);

    const trunkMat = new THREE.MeshLambertMaterial({ color: '#3d2b22' });
    const foliageMat = new THREE.MeshLambertMaterial({ color: '#ff758f' });

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7, 6), trunkMat);
    trunk.position.y = 3.5;
    tree.add(trunk);

    // Canopy Clusters
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3), foliageMat);
    c1.position.set(0, 7.5, 0);
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), foliageMat);
    c2.position.set(-1.8, 6.5, 1.2);
    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), foliageMat);
    c3.position.set(1.8, 6.5, -1.2);

    tree.add(c1);
    tree.add(c2);
    tree.add(c3);

    this.group.add(tree);
  }

  buildFountainPond() {
    // Low-poly Garden Pond at Gift Zone (x: 12, z: 15)
    const pond = new THREE.Group();
    pond.position.set(12, 0, 15);

    const stoneMat = new THREE.MeshLambertMaterial({ color: '#6c757d' });
    const waterMat = new THREE.MeshLambertMaterial({ color: '#0077b6', opacity: 0.85, transparent: true });

    // Outer Ring
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.6, 8), stoneMat);
    ring.position.y = 0.3;
    pond.add(ring);

    // Water Surface
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.1, 8), waterMat);
    water.position.y = 0.5;
    pond.add(water);

    this.group.add(pond);
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
  }

  update() {
    // Animate Petal Particles Drifting Slowly
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
  }
}
