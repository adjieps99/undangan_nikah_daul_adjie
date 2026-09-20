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

    const woodMat = new THREE.MeshLambertMaterial({ color: '#4a2f1b' });
    const roofMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const whiteMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });

    // Platform Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 0.6, 6), whiteMat);
    base.position.y = 0.3;
    gazebo.add(base);

    // Pillars
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6), woodMat);
      pillar.position.set(Math.cos(angle) * 4.5, 3.3, Math.sin(angle) * 4.5);
      gazebo.add(pillar);
    }

    // Cone Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3, 6), roofMat);
    roof.position.y = 7.5;
    gazebo.add(roof);

    this.group.add(gazebo);
  }

  buildReceptionTables() {
    // Banquet Tables & Cake at RSVP Zone (x: 15, z: -15)
    const reception = new THREE.Group();
    reception.position.set(15, 0, -15);

    const tableMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const cakeMat = new THREE.MeshLambertMaterial({ color: '#ffb703' });

    // Table
    const table = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.4, 8), tableMat);
    table.position.y = 0.7;
    reception.add(table);

    // Table Cloth Ribbon Trim
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.2, 8), goldMat);
    trim.position.y = 1.3;
    reception.add(trim);

    // 3-Tier Wedding Cake
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8), cakeMat);
    tier1.position.y = 1.7;
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), tableMat);
    tier2.position.y = 2.25;
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 8), cakeMat);
    tier3.position.y = 2.7;

    reception.add(tier1);
    reception.add(tier2);
    reception.add(tier3);

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
