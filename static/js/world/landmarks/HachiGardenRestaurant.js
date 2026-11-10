import * as THREE from 'three';
import { TextureFactory } from '../../three/TextureFactory.js';

export class HachiGardenRestaurant {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 5.0, -24);
    this.buildRestaurant();
  }

  buildRestaurant() {
    const woodTexture = TextureFactory.createWoodTexture(256);
    const stoneWallTexture = TextureFactory.createStoneWallTexture(256);

    const timberMat = new THREE.MeshLambertMaterial({ map: woodTexture, color: '#4a2e1b' });
    const darkSteelMat = new THREE.MeshLambertMaterial({ color: '#1e2022' });
    const bronzeFrameMat = new THREE.MeshLambertMaterial({ color: '#2c2520' });
    const architecturalGlassMat = new THREE.MeshLambertMaterial({
      color: '#b0d4f1',
      transparent: true,
      opacity: 0.5,
      reflectivity: 0.9
    });
    const warmInteriorMat = new THREE.MeshLambertMaterial({
      color: '#ffd180',
      emissive: 0x663311
    });
    const signBoardMat = new THREE.MeshLambertMaterial({ color: '#2b1d14' });
    const goldTextMat = new THREE.MeshLambertMaterial({ color: '#f5d77f', emissive: 0x997722 });
    const stoneFoundationMat = new THREE.MeshLambertMaterial({ map: stoneWallTexture, color: '#5c544d' });

    // 1. Solid Cut-Stone Plinth & Entrance Terrace Deck
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 18), stoneFoundationMat);
    foundation.position.y = 0.3;
    this.group.add(foundation);

    const deckPaving = new THREE.Mesh(
      new THREE.BoxGeometry(27.6, 0.1, 17.6),
      new THREE.MeshLambertMaterial({ color: '#d8cbb8' })
    );
    deckPaving.position.y = 0.65;
    this.group.add(deckPaving);

    // 2. Structural Steel Columns (Vertical Posts)
    const columnPositions = [
      [-13, -8], [-7.8, -8], [-2.6, -8], [2.6, -8], [7.8, -8], [13, -8],
      [-13, 8], [-7.8, 8], [-2.6, 8], [2.6, 8], [7.8, 8], [13, 8]
    ];
    columnPositions.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 6.8, 0.55), darkSteelMat);
      col.position.set(cx, 4.0, cz);
      this.group.add(col);

      // Footing collar
      const baseCollar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.75), bronzeFrameMat);
      baseCollar.position.set(cx, 0.8, cz);
      this.group.add(baseCollar);
    });

    // 3. Facade Glass Wall with Realistic Vertical & Horizontal Mullions
    // Front Glass Pane
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(25.5, 6.0, 0.08), architecturalGlassMat);
    frontGlass.position.set(0, 3.7, 7.8);
    this.group.add(frontGlass);

    // Horizontal Mullion Bars
    [2.2, 4.2, 6.2].forEach(my => {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.12, 0.2), bronzeFrameMat);
      hBar.position.set(0, my, 7.82);
      this.group.add(hBar);
    });

    // Vertical Mullion Mullions
    for (let mx = -12; mx <= 12; mx += 2.6) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.0, 0.2), bronzeFrameMat);
      vBar.position.set(mx, 3.7, 7.82);
      this.group.add(vBar);
    }

    // Side Glass Panes & Mullions
    [-12.8, 12.8].forEach(sx => {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.0, 15.6), architecturalGlassMat);
      sideGlass.position.set(sx, 3.7, 0);
      this.group.add(sideGlass);

      [2.2, 4.2, 6.2].forEach(my => {
        const sideH = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 15.6), bronzeFrameMat);
        sideH.position.set(sx, my, 0);
        this.group.add(sideH);
      });
    });

    // 4. Warm Interior Dining Volume with Pendant Lanterns Visible Inside Glass
    const interiorRoom = new THREE.Mesh(new THREE.BoxGeometry(24.5, 5.8, 14.5), warmInteriorMat);
    interiorRoom.position.set(0, 3.6, -0.2);
    this.group.add(interiorRoom);

    // Visible Rattan Pendant Lights inside glass facade
    for (let lx = -9; lx <= 9; lx += 4.5) {
      const pendant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.65, 0.7, 8),
        new THREE.MeshLambertMaterial({ color: '#ffb300', emissive: 0x995500 })
      );
      pendant.position.set(lx, 5.0, 5.2);
      this.group.add(pendant);
    }

    // 5. Classic Modern Overhanging Timber Eaves & Fascia
    const mainRoof = new THREE.Mesh(new THREE.BoxGeometry(29.5, 0.45, 19.5), timberMat);
    mainRoof.position.set(0, 7.0, 0);
    this.group.add(mainRoof);

    // Upper Skylight Monitor / Mezzanine Clerestory
    const skylightBox = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.4, 10),
      new THREE.MeshLambertMaterial({ color: '#2c2520' })
    );
    skylightBox.position.set(0, 7.8, 0);
    this.group.add(skylightBox);

    const skylightGlass = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.9, 10.2), architecturalGlassMat);
    skylightGlass.position.set(0, 7.8, 0);
    this.group.add(skylightGlass);

    // 6. Signature "THE HACHI" Architectural Signage
    const hachiSignTex = TextureFactory.createHachiSignageTexture(1024, 256);
    const signPlaqueMat = new THREE.MeshLambertMaterial({
      map: hachiSignTex,
      color: '#ffffff'
    });
    const signPlaque = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.4, 0.22), signPlaqueMat);
    signPlaque.position.set(0, 5.8, 8.12);
    this.group.add(signPlaque);

    // Warm down-facing accent spotlight on the signage
    const signSpot = new THREE.PointLight('#ffe6a3', 1.8, 9.0);
    signSpot.position.set(0, 6.8, 8.8);
    this.group.add(signSpot);

    // 7. Double Entrance Glass Doors with Timber Frame & Handles
    const entryFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.4, 0.35), timberMat);
    entryFrame.position.set(0, 2.35, 7.85);
    this.group.add(entryFrame);

    const entryGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 0.1), architecturalGlassMat);
    entryGlass.position.set(0, 2.35, 7.86);
    this.group.add(entryGlass);

    // Brass Door Handles
    [-0.3, 0.3].forEach(hx => {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), goldTextMat);
      handle.position.set(hx, 2.2, 8.05);
      this.group.add(handle);
    });

    // 8. Wide Stepped Stone Entrance Stairs with Low Landscaping Planters
    for (let s = 0; s < 4; s++) {
      const stepWidth = 6.4 + s * 0.4;
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, 0.22, 1.0),
        new THREE.MeshLambertMaterial({ color: '#564d44' })
      );
      step.position.set(0, 0.55 - s * 0.18, 8.5 + s * 0.85);
      this.group.add(step);
    }

    // Modern architectural planters flanking entrance
    [-5.6, 5.6].forEach(px => {
      const planterBox = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 1.2), timberMat);
      planterBox.position.set(px, 0.8, 8.6);
      this.group.add(planterBox);

      const lushShrub = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.7, 1.0),
        new THREE.MeshLambertMaterial({ color: '#2e6b2c' })
      );
      lushShrub.position.set(px, 1.4, 8.6);
      this.group.add(lushShrub);
    });
  }
}
