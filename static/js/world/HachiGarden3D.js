import * as THREE from 'three';
import { TextureFactory } from '../three/TextureFactory.js';
import { TerrainManager } from './TerrainManager.js';
import { GardenEntrance } from './landmarks/GardenEntrance.js';
import { CoupleProfilePavilion } from './landmarks/CoupleProfilePavilion.js';
import { PhotoGallery } from './landmarks/PhotoGallery.js';
import { ListeningStation } from './landmarks/ListeningStation.js';
import { FoodCourt } from './landmarks/FoodCourt.js';
import { HachiGardenRestaurant } from './landmarks/HachiGardenRestaurant.js';

/**
 * HachiGarden3D - Phase 8: Cinematic Indonesian Dreamscape Refactor
 * Reconstructed 3D world matching the authoritative mockup and actual Hachi Garden references:
 * - Romantic peach & rose sunset sky dome with drifting clouds and 3D crescent moon
 * - Majestic distant Gunung Rinjani volcanic silhouette with atmospheric perspective
 * - Authentic 4-tier terraced tea plantation (terasering kebun teh) with deliberate curved rows
 * - Natural stone retaining walls and curved cobblestone walking pathways
 * - 6 Refined Landmarks:
 *    1. Garden Entrance (Landmark 1)
 *    2. Couple Profile Pavilion (Landmark 2)
 *    3. Photo Gallery (Landmark 3)
 *    4. Listening Station (Landmark 4)
 *    5. Food Court Favorit (Landmark 5)
 *    6. The Hachi Garden Restaurant (Landmark 6)
 * - 480 Instanced contoured tea bushes for 60 FPS mobile performance
 * - Flowering Tabebuia trees, warm pathway lanterns, and drifting blossom petals
 */
export class HachiGarden3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.petalsMesh = null;
    this.petalPositions = [];
    this.clouds = [];

    // 1. Atmosphere: Sky, Moon, Clouds & Gunung Rinjani Silhouette
    this.buildTwilightSkyDome();
    this.buildCrescentMoon();
    this.buildSunsetClouds();
    this.buildGunungRinjaniHorizon();

    // 2. Stepped Tea Plantation Landscape (Terasering)
    this.buildTerracedTeaTerrain();
    this.buildCurvingStonePaths();
    this.buildInstancedTeaBushes();
    this.buildTropicalBlossomTrees();
    this.buildPathwayLanterns();

    // 3. Cultural & Architectural Landmarks
    this.gardenEntrance = new GardenEntrance(); // Landmark 1
    this.group.add(this.gardenEntrance.group);

    this.coupleProfile = new CoupleProfilePavilion(); // Landmark 2
    this.group.add(this.coupleProfile.group);

    this.photoGallery = new PhotoGallery(); // Landmark 3
    this.group.add(this.photoGallery.group);

    this.listeningStation = new ListeningStation(); // Landmark 4
    this.group.add(this.listeningStation.group);

    this.foodCourt = new FoodCourt(); // Landmark 5
    this.group.add(this.foodCourt.group);

    this.hachiRestaurant = new HachiGardenRestaurant(); // Landmark 6
    this.group.add(this.hachiRestaurant.group);

    // 4. Floating Blossom Petal Particles
    this.buildFloatingPetalParticles();
  }

  // ==========================================
  // 1. ATMOSPHERE & BACKGROUND HORIZON
  // ==========================================

  buildTwilightSkyDome() {
    // Inverted sky dome with smooth multi-stop gradient vertex colors
    const skyGeo = new THREE.SphereGeometry(320, 24, 16);
    const count = skyGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);

    // Palette: Twilight violet zenith -> Romantic pink mid -> Warm golden peach horizon
    const zenithColor = new THREE.Color('#4a2246');  // Deep dusk purple
    const midColor = new THREE.Color('#d46282');     // Romantic rose-pink
    const lowColor = new THREE.Color('#f69076');     // Sunset salmon peach
    const horizonColor = new THREE.Color('#ffc19e'); // Golden twilight glow

    const pos = skyGeo.attributes.position;
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const normalizedY = Math.max(0, Math.min(1, (y + 30) / 260));

      let vertexCol;
      if (normalizedY > 0.6) {
        vertexCol = midColor.clone().lerp(zenithColor, (normalizedY - 0.6) / 0.4);
      } else if (normalizedY > 0.22) {
        vertexCol = lowColor.clone().lerp(midColor, (normalizedY - 0.22) / 0.38);
      } else {
        vertexCol = horizonColor.clone().lerp(lowColor, normalizedY / 0.22);
      }

      colors[i * 3] = vertexCol.r;
      colors[i * 3 + 1] = vertexCol.g;
      colors[i * 3 + 2] = vertexCol.b;
    }

    skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false
    });

    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyDome);
  }

  buildCrescentMoon() {
    const moonGroup = new THREE.Group();
    moonGroup.position.set(45, 95, -110);
    moonGroup.rotation.z = -0.35;

    const outerGeo = new THREE.SphereGeometry(3.6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: '#fff9d6', fog: false });
    const moon = new THREE.Mesh(outerGeo, moonMat);

    const innerGeo = new THREE.SphereGeometry(3.3, 16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#442247', fog: false });
    const innerShadow = new THREE.Mesh(innerGeo, shadowMat);
    innerShadow.position.set(1.4, 0.4, 0.2);

    moonGroup.add(moon);
    moonGroup.add(innerShadow);
    this.group.add(moonGroup);
  }

  buildSunsetClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: '#e28896',
      transparent: true,
      opacity: 0.65,
      fog: true
    });

    const cloudPuffs = [
      { x: -70, y: 40, z: -85, s: 15 },
      { x: -30, y: 46, z: -95, s: 19 },
      { x: 18, y: 50, z: -90, s: 22 },
      { x: 68, y: 44, z: -85, s: 17 },
      { x: 110, y: 38, z: -80, s: 14 }
    ];

    cloudPuffs.forEach(cp => {
      const puffGroup = new THREE.Group();
      puffGroup.position.set(cp.x, cp.y, cp.z);

      for (let j = 0; j < 4; j++) {
        const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(cp.s * (0.5 + Math.random() * 0.4)), cloudMat);
        sphere.position.set((j - 1.5) * (cp.s * 0.4), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
        sphere.scale.set(1.4, 0.65, 0.9);
        puffGroup.add(sphere);
      }

      this.clouds.push(puffGroup);
      this.group.add(puffGroup);
    });
  }

  buildGunungRinjaniHorizon() {
    // Volcanic mountain silhouette of Gunung Rinjani in the distance
    const mountainGroup = new THREE.Group();
    mountainGroup.position.set(0, 0, -115);

    const mountainMat = new THREE.MeshLambertMaterial({
      color: '#3d253d',
      fog: true
    });

    const frontRidgeMat = new THREE.MeshLambertMaterial({
      color: '#492a48',
      fog: true
    });

    // 1. Grand Rinjani Main Volcanic Peak
    const mainPeak = new THREE.Mesh(new THREE.ConeGeometry(54, 58, 14), mountainMat);
    mainPeak.position.set(20, 29, -25);
    mainPeak.scale.set(1.25, 1.0, 0.7);
    mountainGroup.add(mainPeak);

    // Caldera shoulder ridge
    const shoulder = new THREE.Mesh(new THREE.ConeGeometry(40, 44, 12), mountainMat);
    shoulder.position.set(50, 22, -30);
    shoulder.scale.set(1.4, 1.0, 0.6);
    mountainGroup.add(shoulder);

    // 2. Western Mountain Ridge (Lombok Hills)
    const westPeak1 = new THREE.Mesh(new THREE.ConeGeometry(46, 40, 12), frontRidgeMat);
    westPeak1.position.set(-45, 20, -15);
    westPeak1.scale.set(1.5, 1.0, 0.8);
    mountainGroup.add(westPeak1);

    const westPeak2 = new THREE.Mesh(new THREE.ConeGeometry(38, 34, 12), frontRidgeMat);
    westPeak2.position.set(-85, 17, -20);
    westPeak2.scale.set(1.6, 1.0, 0.7);
    mountainGroup.add(westPeak2);

    this.group.add(mountainGroup);
  }

  // ==========================================
  // 2. STEPPED TEA PLANTATION (TERASERING)
  // ==========================================

  buildTerracedTeaTerrain() {
    const teaGreenMat = new THREE.MeshLambertMaterial({ color: '#2b6326' }); // Rich natural tea terrace grass
    const darkEarthMat = new THREE.MeshLambertMaterial({ color: '#382a1e' }); // Volcanic earth embankment

    const stoneWallTex = TextureFactory.createStoneWallTexture(512);
    const stoneWallMat = new THREE.MeshLambertMaterial({
      map: stoneWallTex,
      color: '#9e9182'
    });
    const copingMat = new THREE.MeshLambertMaterial({ color: '#4a4137' });

    // 1. Natural Base Ground Plane
    const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), teaGreenMat);
    baseGround.rotation.x = -Math.PI / 2;
    baseGround.position.set(0, -0.02, 0);
    this.group.add(baseGround);

    // Helper: Build an architectural retaining wall with protruding coping stone cap
    const addRetainingWall = (x, yBottom, yTop, z, length, isAlongX = true) => {
      const height = yTop - yBottom;
      const wallThickness = 0.65;
      const capThickness = 0.14;
      const capOverhang = 0.18;

      const wallGeo = isAlongX
        ? new THREE.BoxGeometry(length, height, wallThickness)
        : new THREE.BoxGeometry(wallThickness, height, length);
      const wallMesh = new THREE.Mesh(wallGeo, stoneWallMat);
      wallMesh.position.set(x, yBottom + height / 2, z);
      this.group.add(wallMesh);

      const capGeo = isAlongX
        ? new THREE.BoxGeometry(length + 0.1, capThickness, wallThickness + capOverhang)
        : new THREE.BoxGeometry(wallThickness + capOverhang, capThickness, length + 0.1);
      const capMesh = new THREE.Mesh(capGeo, copingMat);
      capMesh.position.set(x, yTop + capThickness / 2, z);
      this.group.add(capMesh);
    };

    // Helper: Add plateau horizontal green lawn plate
    const addPlateau = (x, y, z, width, length) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), teaGreenMat);
      plate.position.set(x, y - 0.04, z);
      this.group.add(plate);
    };

    // Helper: Add sloped natural berm (earth embankment) flanking a terrace
    const addSlopedBerm = (x, yBottom, yTop, z, width, length, slopeDir = 'z') => {
      const height = yTop - yBottom;
      const berm = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), darkEarthMat);
      berm.position.set(x, yBottom + height / 2, z);
      if (slopeDir === 'z') berm.rotation.x = 0.45;
      else if (slopeDir === '-z') berm.rotation.x = -0.45;
      else if (slopeDir === 'x') berm.rotation.z = -0.45;
      else if (slopeDir === '-x') berm.rotation.z = 0.45;
      this.group.add(berm);
    };

    // --- Terrace 0: Garden Entrance Plateau (y = 0.0, z: 24 to 38, x: -16 to 16) ---
    addPlateau(0, 0.0, 31, 32, 14);

    // --- Terrace 1: Central Garden & East Wing Plateau (y = 2.0, z: -6 to 18, x: -14 to 28) ---
    addPlateau(7, 2.0, 6, 42, 24);
    // Front Retaining Wall (z = 18.0, height = 2.0), split cleanly by Staircase 1 at x in [-3.2, 3.2]
    addRetainingWall(-8.6, 0.0, 2.0, 18.0, 10.8, true); // West section (x: -14 to -3.2)
    addRetainingWall(15.6, 0.0, 2.0, 18.0, 24.8, true); // East section (x: 3.2 to 28)
    // East Boundary Retaining Wall (x = 28.0, z: -6 to 18)
    addRetainingWall(28.0, 0.0, 2.0, 6.0, 24.0, false);

    // --- Terrace 2: Music Lounge Terrace (y = 1.0, z: 0 to 16, x: -36 to -14) ---
    addPlateau(-25, 1.0, 8, 22, 16);
    // Retaining Wall dividing Central Garden (y=2.0) from Music Terrace (y=1.0) along x = -14.0
    // Split by Staircase 2 at z in [5.8, 10.2]
    addRetainingWall(-14.0, 1.0, 2.0, 13.1, 5.8, false); // South of stairs (z: 10.2 to 16)
    addRetainingWall(-14.0, 1.0, 2.0, 2.9, 5.8, false);  // North of stairs (z: 0 to 5.8)
    // Outer South & West Retaining Walls
    addRetainingWall(-25.0, 0.0, 1.0, 16.0, 22.0, true);
    addSlopedBerm(-36.5, 0.0, 1.0, 8.0, 2.5, 16, '-x');

    // --- Terrace 3: Food Court Terrace (y = 3.2, z: -18 to -2, x: -36 to -14) ---
    addPlateau(-25, 3.2, -10, 22, 16);
    // Retaining Wall dividing Food Court (y=3.2) from Central Garden (y=2.0) along x = -14.0
    // Split by Staircase 3 at z in [-6.5, -1.5]
    addRetainingWall(-14.0, 2.0, 3.2, -12.25, 11.5, false); // North of stairs (z: -18 to -6.5)
    // Hillside Stone Wall dividing Food Court (y=3.2) from green buffer to Music (y=1.0) along z = -2.0
    addRetainingWall(-25.0, 1.0, 3.2, -2.0, 22.0, true);
    addSlopedBerm(-36.5, 1.0, 3.2, -10.0, 2.5, 16, '-x');

    // --- Terrace 4: Top Grand Plateau (The Hachi Restaurant, y = 5.0, z: -38 to -14, x: -30 to 30) ---
    addPlateau(0, 5.0, -26, 60, 24);
    // Front Retaining Wall (z = -14.0), split by Grand Central Staircase at x in [-3.8, 3.8]
    addRetainingWall(-16.9, 3.2, 5.0, -14.0, 26.2, true); // West wall (rises from Food Court / hillside)
    addRetainingWall(16.9, 2.0, 5.0, -14.0, 26.2, true);  // East wall (rises from Central Garden)
    // Flanking Retaining Walls
    addRetainingWall(-30.0, 3.2, 5.0, -26.0, 24.0, false);
    addRetainingWall(30.0, 2.0, 5.0, -26.0, 24.0, false);
  }

  buildCurvingStonePaths() {
    const flagstoneTex = TextureFactory.createFlagstoneTexture(512);
    const stonePathMat = new THREE.MeshLambertMaterial({
      map: flagstoneTex,
      color: '#d4c9b6'
    });
    const curbStoneMat = new THREE.MeshLambertMaterial({ color: '#4a3f35' });
    const stairStepMat = new THREE.MeshLambertMaterial({ color: '#564c42' });

    // Helper: Add clean flagstone paving segment without rotation confusion
    // curbSides: 'x' = curbs on +/- X (for North-South paths), 'z' = curbs on +/- Z (for East-West paths), 'none' = no curbs
    const addPathSegment = (x, y, z, widthInX, lengthInZ, curbSides = 'none') => {
      const segGroup = new THREE.Group();
      segGroup.position.set(x, y + 0.02, z);

      // Paving slab
      const paving = new THREE.Mesh(new THREE.BoxGeometry(widthInX, 0.04, lengthInZ), stonePathMat);
      segGroup.add(paving);

      if (curbSides === 'x') {
        const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, lengthInZ), curbStoneMat);
        curbLeft.position.set(-widthInX / 2 - 0.06, 0.02, 0);
        segGroup.add(curbLeft);

        const curbRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, lengthInZ), curbStoneMat);
        curbRight.position.set(widthInX / 2 + 0.06, 0.02, 0);
        segGroup.add(curbRight);
      } else if (curbSides === 'z') {
        const curbTop = new THREE.Mesh(new THREE.BoxGeometry(widthInX, 0.06, 0.12), curbStoneMat);
        curbTop.position.set(0, 0.02, -lengthInZ / 2 - 0.06);
        segGroup.add(curbTop);

        const curbBottom = new THREE.Mesh(new THREE.BoxGeometry(widthInX, 0.06, 0.12), curbStoneMat);
        curbBottom.position.set(0, 0.02, lengthInZ / 2 + 0.06);
        segGroup.add(curbBottom);
      }

      this.group.add(segGroup);
    };

    // Helper: Add destination plaza with stone torus rim
    const addDestinationPlaza = (x, y, z, radius, segments = 24) => {
      const plazaGroup = new THREE.Group();
      plazaGroup.position.set(x, y + 0.02, z);

      const plazaGeo = new THREE.CylinderGeometry(radius, radius + 0.05, 0.04, segments);
      const plazaMesh = new THREE.Mesh(plazaGeo, stonePathMat);
      plazaGroup.add(plazaMesh);

      const ringGeo = new THREE.TorusGeometry(radius + 0.02, 0.06, 6, segments);
      const ringMesh = new THREE.Mesh(ringGeo, curbStoneMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.02;
      plazaGroup.add(ringMesh);

      this.group.add(plazaGroup);
    };

    // Helper: Add precision stone staircase matching TerrainManager math
    const addStaircase = (startX, startY, startZ, steps, dx, dy, dz, width = 4.2) => {
      const cheekThickness = 0.28;
      const isAlongX = Math.abs(dx) > Math.abs(dz);
      const stepRun = isAlongX ? Math.abs(dx) : Math.abs(dz);
      const stepRise = Math.abs(dy);

      for (let s = 0; s < steps; s++) {
        const sx = startX + s * dx;
        const sy = startY + s * dy;
        const sz = startZ + s * dz;

        // Tread step slab with slight generous overlap (+0.08m) to eliminate any seams
        const treadW = isAlongX ? stepRun + 0.08 : width;
        const treadH = stepRise + 0.08;
        const treadL = isAlongX ? width : stepRun + 0.08;

        const step = new THREE.Mesh(new THREE.BoxGeometry(treadW, treadH, treadL), stairStepMat);
        step.position.set(sx, sy, sz);
        this.group.add(step);

        // Flanking solid stone retaining cheek parapets
        if (isAlongX) {
          // Cheeks run along X, flanking North (-Z) and South (+Z)
          const cheekGeo = new THREE.BoxGeometry(stepRun + 0.10, stepRise + 0.24, cheekThickness);
          const cheekN = new THREE.Mesh(cheekGeo, curbStoneMat);
          cheekN.position.set(sx, sy + 0.09, sz - width / 2 - cheekThickness / 2);
          this.group.add(cheekN);

          const cheekS = new THREE.Mesh(cheekGeo, curbStoneMat);
          cheekS.position.set(sx, sy + 0.09, sz + width / 2 + cheekThickness / 2);
          this.group.add(cheekS);
        } else {
          // Cheeks run along Z, flanking West (-X) and East (+X)
          const cheekGeo = new THREE.BoxGeometry(cheekThickness, stepRise + 0.24, stepRun + 0.10);
          const cheekW = new THREE.Mesh(cheekGeo, curbStoneMat);
          cheekW.position.set(sx - width / 2 - cheekThickness / 2, sy + 0.09, sz);
          this.group.add(cheekW);

          const cheekE = new THREE.Mesh(cheekGeo, curbStoneMat);
          cheekE.position.set(sx + width / 2 + cheekThickness / 2, sy + 0.09, sz);
          this.group.add(cheekE);
        }
      }
    };

    // -------------------------------------------------------------
    // 1. PRIMARY ARTERY: ENTRANCE PROMENADE (y = 0.0, z: 24 to 32, x = 0)
    // -------------------------------------------------------------
    addDestinationPlaza(0, 0.0, 32.0, 4.2, 20); // Gate Arrival Plaza
    addPathSegment(0, 0.0, 28.0, 5.0, 8.0, 'x');

    // Staircase 1: Rising from Entrance (y = 0.0, z = 24.0) to Central Garden (y = 2.0, z = 18.0)
    // 10 steps, dz = -0.6, dy = 0.20, width = 6.0
    addStaircase(0, 0.10, 23.7, 10, 0, 0.20, -0.6, 6.0);

    // -------------------------------------------------------------
    // 2. PRIMARY ARTERY: CENTRAL GARDEN GRAND PROMENADE (y = 2.0, z: -6 to 18)
    // Pure, open, unobstructed processional sightline toward THE HACHI!
    // -------------------------------------------------------------
    // South section (z: 11 to 18)
    addPathSegment(0, 2.0, 14.5, 5.0, 7.0, 'x');

    // Central Grand Junction Hub (z: 5.0 to 11.0, width 5.0 in X connects seamlessly to East/West branches)
    addPathSegment(0, 2.0, 8.0, 5.0, 6.0, 'none');

    // North section (z: -6 to 5.0)
    addPathSegment(0, 2.0, -0.5, 5.0, 11.0, 'x');

    // -------------------------------------------------------------
    // 3. SECONDARY PATHWAY: MUSIC LOUNGE (WEST WING, y = 1.0)
    // -------------------------------------------------------------
    // West branch apron connecting Central Hub (x: -2.5) to Staircase 2 head (x: -8.5), z in [5.9, 10.1]
    addPathSegment(-5.5, 2.0, 8.0, 6.2, 4.2, 'z');

    // Staircase 2: Connecting Central Garden (y = 2.0, x = -8.5) down to Music Terrace (y = 1.0, x = -13.5)
    // 6 steps, dx = -0.833, dy = -0.166, dz = 0, width = 4.2
    addStaircase(-8.5, 1.91, 8.0, 6, -0.833, -0.166, 0, 4.2);

    // Paved approach walkway from base of stairs (x = -13.5) extending generously into Music Plaza edge (to x = -19.2)
    addPathSegment(-16.35, 1.0, 8.0, 5.8, 4.2, 'z');

    // Expansive 12m Diameter Music Lounge Plaza (centered at x = -24, z = 8, y = 1.0, radius 6.0m)
    addDestinationPlaza(-24.0, 1.0, 8.0, 6.0, 28);

    // -------------------------------------------------------------
    // 4. SECONDARY PATHWAY: FAVORITE FOOD COURT (NORTHWEST WING, y = 3.2)
    // -------------------------------------------------------------
    // West branch apron connecting Central Promenade (x: -2.5) to Staircase 3 foot (x: -8.5), z in [-6.1, -1.9]
    addPathSegment(-5.5, 2.0, -4.0, 6.2, 4.2, 'z');

    // Staircase 3: Connecting Central Garden (y = 2.0, x = -8.5) up to Food Court (y = 3.2, x = -14.5)
    // 7 steps, dx = -0.857, dy = 0.171, dz = 0, width = 4.2
    addStaircase(-8.5, 2.18, -4.0, 7, -0.857, 0.171, 0, 4.2);

    // Approach walkway connecting top of stairs (x = -14.5) to Food Court deck with seamless corner junction
    addPathSegment(-16.5, 3.2, -4.0, 4.2, 4.2, 'z');
    addPathSegment(-18.0, 3.2, -7.5, 4.2, 7.2, 'x');

    // Food Court Forecourt Landing (connecting into the 12m x 9m dining deck)
    addDestinationPlaza(-20.0, 3.2, -10.0, 4.8, 20);

    // -------------------------------------------------------------
    // 5. SECONDARY PATHWAY: PHOTO GALLERY & COUPLE PROFILE (EAST WING, y = 2.0)
    // -------------------------------------------------------------
    // Branch to Photo Gallery: from Central Hub (x: 2.5) to Gallery viewing plaza (x: 18.0, z: 8.0)
    addPathSegment(10.25, 2.0, 8.0, 15.5, 4.2, 'z');
    addDestinationPlaza(18.0, 2.0, 8.0, 4.5, 20); // Gallery Viewing Plaza

    // Branch to Couple Profile: from Central Promenade (x: 2.5) to Pavilion deck (x: 18.0, z: -6.0)
    addPathSegment(10.25, 2.0, -6.0, 15.5, 4.2, 'z');
    addDestinationPlaza(18.0, 2.0, -6.0, 4.5, 20); // Profile Pavilion Plaza

    // -------------------------------------------------------------
    // 6. PRIMARY GRAND PROMENADE: GRAND STAIRCASE & RESTAURANT FORECOURT (y = 5.0)
    // -------------------------------------------------------------
    // Grand Central Staircase: Connecting Central Garden (y = 2.0, z = -6.0) to Top Terrace (y = 5.0, z = -14.0)
    // 12 steps, centered at x = 0, dz = -0.66, dy = 0.25, width = 7.2
    addStaircase(0, 2.12, -6.4, 12, 0, 0.25, -0.66, 7.2);

    // 4 Grand Stone Lantern Pedestals flanking Grand Central Staircase
    const lanternPedMat = new THREE.MeshLambertMaterial({ color: '#3a332a' });
    const lanternGlowMat = new THREE.MeshLambertMaterial({ color: '#ffe494', emissive: 0xffaa22 });
    [[-4.2, 2.0, -6.0], [4.2, 2.0, -6.0], [-4.2, 5.0, -14.0], [4.2, 5.0, -14.0]].forEach(([lx, ly, lz]) => {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.2, 8), lanternPedMat);
      ped.position.set(lx, ly + 0.6, lz);
      this.group.add(ped);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.42), lanternGlowMat);
      lamp.position.set(lx, ly + 1.35, lz);
      this.group.add(lamp);
    });

    // Top Restaurant Forecourt Promenade Deck (y = 5.0, z = -15.5)
    addPathSegment(0, 5.0, -15.5, 8.0, 4.0, 'none');
    addPathSegment(-12.0, 5.0, -15.5, 16.0, 4.0, 'z');
    addPathSegment(12.0, 5.0, -15.5, 16.0, 4.0, 'z');
  }

  buildInstancedTeaBushes() {
    // 480 Contoured tea bushes arranged in agricultural terraces with generous setbacks (> 3m) from all pathways
    const bushCount = 480;
    const teaFoliageTex = TextureFactory.createTeaFoliageTexture(256);

    const bushGeo = new THREE.CylinderGeometry(1.2, 0.80, 0.70, 10);
    bushGeo.scale(1.15, 0.95, 1.05);

    const teaBushMat = new THREE.MeshLambertMaterial({
      map: teaFoliageTex,
      color: '#34782a'
    });
    const instancedBushes = new THREE.InstancedMesh(bushGeo, teaBushMat, bushCount);

    const dummy = new THREE.Object3D();
    let idx = 0;

    const addBushRow = (startX, startZ, endX, endZ, yElevation, count, variation = 0.5) => {
      for (let i = 0; i < count && idx < bushCount; i++) {
        const t = i / (count - 1);
        const bx = startX + (endX - startX) * t + (Math.sin(t * Math.PI * 2) * variation);
        const bz = startZ + (endZ - startZ) * t + (Math.cos(t * Math.PI) * variation);
        const by = yElevation + 0.40;

        dummy.position.set(bx, by, bz);
        const scale = 0.95 + Math.random() * 0.30;
        dummy.scale.set(scale, scale * (0.85 + Math.random() * 0.20), scale);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();

        instancedBushes.setMatrixAt(idx++, dummy.matrix);
      }
    };

    // Plantation Rows (Strictly outside pathways):
    // 1. Entrance / Lower Foreground Rows (flanking gate, z: 28 to 36)
    addBushRow(-30, 32, -10, 32, 0.0, 14, 0.8);
    addBushRow(10, 32, 30, 32, 0.0, 14, 0.8);
    addBushRow(-32, 35, -12, 35, 0.0, 14, 0.6);
    addBushRow(12, 35, 32, 35, 0.0, 14, 0.6);

    // 2. Hillside Buffer between Music Area and Food Court (z: -2 to 2, x: -34 to -14)
    addBushRow(-34, 0, -16, 0, 1.8, 14, 0.6);
    addBushRow(-34, -2, -16, -2, 2.4, 14, 0.5);

    // 3. Central Garden Side Terraces (flanking main walkway, clear of center x in [-5, 5])
    addBushRow(-12, 14, -6, 14, 2.0, 8, 0.4);
    addBushRow(6, 14, 24, 14, 2.0, 14, 0.6);
    addBushRow(-12, 2, -6, 2, 2.0, 8, 0.4);
    addBushRow(6, 2, 24, 2, 2.0, 14, 0.6);

    // 4. North Slopes Flanking Grand Staircase (clear of stairs x in [-5, 5] and Food Court corridor x in [-29, -14])
    // 4a. Western outer embankment (behind/west of Food Court)
    addBushRow(-36, -8, -30, -8, 3.2, 6, 0.3);
    addBushRow(-36, -12, -30, -12, 4.0, 6, 0.3);

    // 4b. Hillside terrace between Food Court wall (x = -14) and Grand Staircase (x = -5)
    addBushRow(-13.5, -8, -5.5, -8, 2.8, 8, 0.3);
    addBushRow(-13.5, -12, -5.5, -12, 4.0, 8, 0.3);

    // 4c. Eastern slope (mirroring east of Grand Staircase)
    addBushRow(8, -8, 32, -8, 2.0, 16, 0.8);
    addBushRow(8, -12, 32, -12, 3.5, 16, 0.8);

    // 5. Outer Venue Perimeter Rows (z: -30 to -34)
    addBushRow(-36, -32, -16, -32, 5.0, 14, 0.8);
    addBushRow(16, -32, 36, -32, 5.0, 14, 0.8);

    // Fill remaining slots along outer world edges
    while (idx < bushCount) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 36 + Math.random() * 10;
      dummy.position.set(Math.cos(angle) * dist, 0.55, Math.sin(angle) * dist);
      dummy.scale.set(0.95, 0.85, 0.95);
      dummy.updateMatrix();
      instancedBushes.setMatrixAt(idx++, dummy.matrix);
    }

    instancedBushes.instanceMatrix.needsUpdate = true;
    this.group.add(instancedBushes);
  }

  buildTropicalBlossomTrees() {
    const barkMat = new THREE.MeshLambertMaterial({ color: '#442d1f' });
    const pinkBlossomMat = new THREE.MeshLambertMaterial({ color: '#ff9ebb' });
    const peachBlossomMat = new THREE.MeshLambertMaterial({ color: '#fca311' });

    // Strategic, picturesque tree placement framing vistas without blocking paths or camera lines
    // Central axis (x in [-6, 6]) is 100% UNBLOCKED so THE HACHI is clearly visible from anywhere!
    const treePositions = [
      // 1. Entrance & Arrival Garden (y = 0.0)
      { x: -14, z: 30 },
      { x: 14, z: 30 },
      { x: -14, z: 22 },
      { x: 14, z: 22 },
      // 2. Music Lounge Scenic Perimeter (y = 1.0, clear of plaza)
      { x: -34, z: 14 },
      { x: -34, z: 2 },
      // 3. Food Court Outer Perimeter (y = 3.2, clear of dining deck)
      { x: -34, z: -4 },
      { x: -34, z: -16 },
      // 4. East Wing Overlook (y = 2.0, clear of Gallery & Profile)
      { x: 26, z: 14 },
      { x: 26, z: 0 },
      { x: 26, z: -12 },
      // 5. The Hachi Restaurant Flanking Groves (y = 5.0, framing the venue)
      { x: -26, z: -24 },
      { x: 26, z: -24 }
    ];

    treePositions.forEach((tp, i) => {
      const groundY = TerrainManager.getHeight(tp.x, tp.z);
      const tree = new THREE.Group();
      tree.position.set(tp.x, groundY, tp.z);

      // Flared buttress root base anchoring firmly into the soil
      const rootBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.25, 0.45, 8), barkMat);
      rootBase.position.y = 0.20;
      tree.add(rootBase);

      // 4 Root spurs spreading into terrain
      for (let r = 0; r < 4; r++) {
        const angle = (r * Math.PI) / 2 + 0.35;
        const spur = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.90), barkMat);
        spur.position.set(Math.cos(angle) * 0.75, 0.08, Math.sin(angle) * 0.75);
        spur.rotation.y = angle;
        spur.rotation.x = 0.16;
        tree.add(spur);
      }

      // Elevated trunk (height 6.0m) so canopy provides full vertical clearance over pedestrians and cameras
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.55, 6.0, 8), barkMat);
      trunk.position.y = 3.1;
      trunk.rotation.z = (i % 2 === 0 ? 0.05 : -0.05);
      tree.add(trunk);

      const bMat = i % 2 === 0 ? pinkBlossomMat : peachBlossomMat;
      // Canopy puffs elevated above y = 6.4m (bottom edge at y = 4.8m+, well above character & camera)
      const canopyOffsets = [
        [0, 6.8, 0, 2.2],
        [-1.4, 6.4, 0.8, 1.7],
        [1.5, 6.6, -0.7, 1.8],
        [0.4, 7.8, 0.3, 1.7]
      ];

      canopyOffsets.forEach(([ox, oy, oz, rad]) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(rad), bMat);
        puff.position.set(ox, oy, oz);
        tree.add(puff);
      });

      this.group.add(tree);
    });
  }

  buildPathwayLanterns() {
    const stoneFootMat = new THREE.MeshLambertMaterial({ color: '#453f3a' });
    const woodFrameMat = new THREE.MeshLambertMaterial({ color: '#4a2c17' });
    const amberLightMat = new THREE.MeshLambertMaterial({ color: '#ffe28a', emissive: 0xaa6611 });

    const lanternCoords = [
      { x: -3.2, z: 28 },
      { x: 3.2, z: 28 },
      { x: -3.2, z: 18 },
      { x: 3.2, z: 18 },
      // Four corners of the cross junction (outside of walking paths)
      { x: -3.4, z: 11.2 },
      { x: 3.4, z: 11.2 },
      { x: -3.4, z: 4.8 },
      { x: 3.4, z: 4.8 },
      // Pathway towards Grand Staircase
      { x: -3.2, z: -3.5 },
      { x: 3.2, z: -3.5 },
      // Wing pathways (placed on edges, not in the center of walkway)
      { x: -16.0, z: 10.5 },
      { x: -16.0, z: -7.5 },
      { x: 14.0, z: 10.5 },
      { x: 14.0, z: -3.5 }
    ];

    lanternCoords.forEach(c => {
      const groundY = TerrainManager.getHeight(c.x, c.z);
      const lantern = new THREE.Group();
      lantern.position.set(c.x, groundY, c.z);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 6), stoneFootMat);
      base.position.y = 0.2;
      lantern.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), woodFrameMat);
      pole.position.y = 0.9;
      lantern.add(pole);

      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.45), woodFrameMat);
      cage.position.y = 1.7;
      lantern.add(cage);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), amberLightMat);
      lamp.position.y = 1.7;
      lantern.add(lamp);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), woodFrameMat);
      roof.position.y = 2.15;
      roof.rotation.y = Math.PI / 4;
      lantern.add(roof);

      this.group.add(lantern);
    });
  }

  buildFloatingPetalParticles() {
    const petalCount = 80;
    const petalGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      const px = (Math.random() - 0.5) * 60;
      const py = 1.0 + Math.random() * 10;
      const pz = (Math.random() - 0.5) * 60;
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      this.petalPositions.push({ x: px, y: py, z: pz, speed: 0.015 + Math.random() * 0.02, sway: Math.random() * Math.PI * 2 });
    }

    petalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const petalMat = new THREE.PointsMaterial({
      color: '#ffaec8',
      size: 0.35,
      transparent: true,
      opacity: 0.8
    });

    this.petalsMesh = new THREE.Points(petalGeo, petalMat);
    this.group.add(this.petalsMesh);
  }

  update(delta = 0.016) {
    // Animate drifting clouds
    this.clouds.forEach((cloud, i) => {
      cloud.position.x += 0.03 * (i % 2 === 0 ? 1 : 0.8);
      if (cloud.position.x > 140) cloud.position.x = -140;
    });

    // Animate falling flower petals
    if (this.petalsMesh) {
      const pos = this.petalsMesh.geometry.attributes.position;
      for (let i = 0; i < this.petalPositions.length; i++) {
        const p = this.petalPositions[i];
        p.y -= p.speed;
        p.sway += 0.03;
        p.x += Math.sin(p.sway) * 0.015;

        if (p.y < 0.2) {
          p.y = 10;
          p.x = (Math.random() - 0.5) * 60;
        }

        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    }
  }
}
