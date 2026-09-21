import * as THREE from 'three';
import { WeddingArch } from './landmarks/WeddingArch.js';
import { Gazebo } from './landmarks/Gazebo.js';
import { ReceptionTable } from './landmarks/ReceptionTable.js';
import { WishingTree } from './landmarks/WishingTree.js';
import { LocationSignboard } from './landmarks/LocationSignboard.js';
import { FountainPond } from './landmarks/FountainPond.js';

export class HachiGarden3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.petalsMesh = null;
    this.petalPositions = [];

    this.buildTerrain();
    this.buildBoulevardPaths();
    this.buildBoundaryDecorations();
    this.buildDirectionalSigns();
    this.buildEnvironmentDressing();

    // Modular Landmarks
    this.weddingArch = new WeddingArch();
    this.group.add(this.weddingArch.group);

    this.gazebo = new Gazebo();
    this.group.add(this.gazebo.group);

    this.receptionTable = new ReceptionTable();
    this.group.add(this.receptionTable.group);

    this.wishingTree = new WishingTree();
    this.group.add(this.wishingTree.group);

    this.locationSignboard = new LocationSignboard();
    this.group.add(this.locationSignboard.group);

    this.fountainPond = new FountainPond();
    this.group.add(this.fountainPond.group);

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

  buildBoulevardPaths() {
    const curbMat = new THREE.MeshLambertMaterial({ color: '#b8a58a' });
    const goldLineMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#5c4033' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const warmGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe082', emissive: 0x443300 });

    // 1. Stone Curbs & Gold Accent Lines on Vertical Runway
    for (let side of [-4.1, 4.1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 80), curbMat);
      curb.position.set(side, 0.06, 0);
      this.group.add(curb);

      const goldLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 80), goldLineMat);
      goldLine.position.set(side * 0.95, 0.07, 0);
      this.group.add(goldLine);
    }

    // 2. Stone Curbs on Horizontal Cross Paths
    for (let zPos of [-15, 15]) {
      for (let side of [-3.1, 3.1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(60, 0.12, 0.3), curbMat);
        curb.position.set(0, 0.06, zPos + side);
        this.group.add(curb);
      }
    }

    // 3. Glowing Garden Lamp Posts along Pathways
    const lampPositions = [
      { x: -4.8, z: -30 }, { x: 4.8, z: -30 },
      { x: -4.8, z: -5 },  { x: 4.8, z: -5 },
      { x: -4.8, z: 22 },  { x: 4.8, z: 22 },
      { x: -25, z: -18.4 }, { x: 25, z: -18.4 },
      { x: -25, z: 18.4 },  { x: 25, z: 18.4 }
    ];

    lampPositions.forEach(p => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(p.x, 0, p.z);

      // Wooden Post & Gold Pedestal
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 8), darkWoodMat);
      post.position.y = 1.6;
      lampGroup.add(post);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), goldMat);
      baseTrim.position.y = 0.075;
      lampGroup.add(baseTrim);

      const capTrim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.35), goldMat);
      capTrim.position.y = 3.25;
      lampGroup.add(capTrim);

      // Lantern Glass Head & Warm Glow Core
      const lanternHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), goldMat);
      lanternHead.position.y = 3.55;
      lampGroup.add(lanternHead);

      const lanternGlow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.32), warmGlowMat);
      lanternGlow.position.y = 3.55;
      lampGroup.add(lanternGlow);

      const roofCone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 4), goldMat);
      roofCone.position.y = 3.95;
      lampGroup.add(roofCone);

      this.group.add(lampGroup);
    });
  }

  buildBoundaryDecorations() {
    const hedgeMat = new THREE.MeshLambertMaterial({ color: '#2d5022' });
    const fenceMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const fenceGoldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const cypressMat = new THREE.MeshLambertMaterial({ color: '#1b3b16' });
    const flowerColors = ['#ff4d6d', '#ffb703', '#ffffff', '#e8a5b0'];

    // Outer boundary limits (Square perimeter around -43 to 43)
    const boundaries = [
      { axis: 'z', val: -43, start: -43, end: 43 },
      { axis: 'z', val: 43, start: -43, end: 43 },
      { axis: 'x', val: -43, start: -43, end: 43 },
      { axis: 'x', val: 43, start: -43, end: 43 }
    ];

    boundaries.forEach(b => {
      for (let pos = b.start; pos <= b.end; pos += 3.8) {
        // Skip entrance zone (x: -5 to 5, z: 28 to 35)
        if (b.axis === 'z' && b.val > 35 && Math.abs(pos) < 6) continue;

        const posX = b.axis === 'x' ? b.val : pos;
        const posZ = b.axis === 'z' ? b.val : pos;

        const type = Math.floor(Math.abs(pos * 3 + (b.val > 0 ? 1 : 2))) % 4;

        if (type === 0) {
          // Lush Green Hedge Bush
          const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 1.0), hedgeMat);
          hedge.position.set(posX, 0.7, posZ);
          this.group.add(hedge);
        } else if (type === 1) {
          // White Wooden Picket Fence section
          const fenceGroup = new THREE.Group();
          fenceGroup.position.set(posX, 0, posZ);
          if (b.axis === 'x') fenceGroup.rotation.y = Math.PI / 2;

          const railTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.12), fenceMat);
          railTop.position.y = 1.0;
          fenceGroup.add(railTop);

          const railBot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.12), fenceMat);
          railBot.position.y = 0.3;
          fenceGroup.add(railBot);

          for (let p = -1.6; p <= 1.6; p += 0.8) {
            const picket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.06), fenceMat);
            picket.position.set(p, 0.55, 0);
            fenceGroup.add(picket);

            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), fenceGoldMat);
            tip.position.set(p, 1.15, 0);
            fenceGroup.add(tip);
          }
          this.group.add(fenceGroup);
        } else if (type === 2) {
          // Small Conifer Cypress Tree
          const cypress = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 6), cypressMat);
          cypress.position.set(posX, 1.6, posZ);
          this.group.add(cypress);
        } else {
          // Floral Hedge Cluster
          const hedge = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), hedgeMat);
          hedge.position.set(posX, 0.8, posZ);
          this.group.add(hedge);

          const color = flowerColors[Math.abs(Math.floor(pos)) % flowerColors.length];
          const roseMat = new THREE.MeshLambertMaterial({ color });
          for (let f = 0; f < 3; f++) {
            const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), roseMat);
            fl.position.set(posX + (Math.random() - 0.5) * 1.2, 1.2 + Math.random() * 0.4, posZ + (Math.random() - 0.5) * 1.2);
            this.group.add(fl);
          }
        }
      }
    });
  }

  buildDirectionalSigns() {
    // 3D Wooden Directional Signpost at Crossroads (x: 0, z: -2)
    const signpost = new THREE.Group();
    signpost.position.set(0, 0, -2);

    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#5c4033' });
    const whiteWoodMat = new THREE.MeshLambertMaterial({ color: '#fffdf9' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });

    // Central Pole & Gold Finial Cap
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.8, 8), darkWoodMat);
    pole.position.y = 1.9;
    signpost.add(pole);

    const poleCap = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 6), goldMat);
    poleCap.position.y = 3.9;
    signpost.add(poleCap);

    // Directional Wooden Planks pointing to venue areas
    const planksData = [
      { text: '💍 GAZEBO PENGANTIN', angle: Math.PI * 0.75, y: 3.4 },
      { text: '✉️ MEJA RSVP', angle: Math.PI * 0.25, y: 3.0 },
      { text: '🌸 WISHING TREE', angle: -Math.PI * 0.75, y: 2.6 },
      { text: '🎁 KOTAK HADIAH', angle: -Math.PI * 0.25, y: 2.2 }
    ];

    planksData.forEach(p => {
      const plankGroup = new THREE.Group();
      plankGroup.position.set(0, p.y, 0);
      plankGroup.rotation.y = p.angle;

      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 0.08), whiteWoodMat);
      plank.position.set(0.9, 0, 0);
      plankGroup.add(plank);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.1), goldMat);
      trim.position.set(0.9, 0.16, 0);
      plankGroup.add(trim);

      const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 3), goldMat);
      pointer.rotation.z = -Math.PI / 2;
      pointer.position.set(1.9, 0, 0);
      plankGroup.add(pointer);

      signpost.add(plankGroup);
    });

    // Decorative Rose Cluster at Post Base
    for (let r = 0; r < 4; r++) {
      const angle = (r * Math.PI) / 2;
      const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), rosePinkMat);
      rose.position.set(Math.cos(angle) * 0.35, 0.2, Math.sin(angle) * 0.35);
      signpost.add(rose);
    }

    this.group.add(signpost);
  }

  buildEnvironmentDressing() {
    const whiteWoodMat = new THREE.MeshLambertMaterial({ color: '#fff8f0' });
    const warmWoodMat = new THREE.MeshLambertMaterial({ color: '#9e6f47' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const rosePinkMat = new THREE.MeshLambertMaterial({ color: '#f4abb7' });

    // 1. Garden Benches placed along pathways
    const benchPositions = [
      { x: -5.8, z: -8, rot: Math.PI / 2 },
      { x: 5.8, z: -8, rot: -Math.PI / 2 },
      { x: -5.8, z: 8, rot: Math.PI / 2 },
      { x: 5.8, z: 8, rot: -Math.PI / 2 }
    ];

    benchPositions.forEach(b => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(b.x, 0, b.z);
      benchGroup.rotation.y = b.rot;

      // Wooden Seat & Backrest
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.8), warmWoodMat);
      seat.position.y = 0.55;
      benchGroup.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.1), warmWoodMat);
      backrest.position.set(0, 0.95, -0.38);
      benchGroup.add(backrest);

      // Iron/Wood Leg Supports
      for (let lx of [-0.95, 0.95]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.75), whiteWoodMat);
        leg.position.set(lx, 0.275, 0);
        benchGroup.add(leg);
      }

      this.group.add(benchGroup);
    });

    // 2. Floral Planter Urns along path crossroads
    const planterPositions = [
      { x: -5.5, z: -13 }, { x: 5.5, z: -13 },
      { x: -5.5, z: 13 },  { x: 5.5, z: 13 }
    ];

    planterPositions.forEach(p => {
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.7, 8), whiteWoodMat);
      urn.position.set(p.x, 0.35, p.z);
      this.group.add(urn);

      const urnTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 8), goldMat);
      urnTrim.position.set(p.x, 0.7, p.z);
      this.group.add(urnTrim);

      // Rose bouquet inside urn
      for (let f = 0; f < 3; f++) {
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), rosePinkMat);
        rose.position.set(p.x + (Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.15, p.z + (Math.random() - 0.5) * 0.3);
        this.group.add(rose);
      }
    });
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

        const flap = Math.sin(b.time * 25) * 0.6;
        b.wings.scale.x = 0.5 + Math.abs(flap);
      });
    }
  }
}
