import * as THREE from 'three';

/**
 * Gazebo - Resepsi Nikah: Grand Pendopo Sunda / Bale Sasak Lombok
 * High terrace reception pavilion featuring tiered joglo/lumbung timber roof,
 * teak wood columns, wedding stage (pelaminan), glowing chandeliers,
 * and festive fairylights.
 */
export class Gazebo {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-18, 5.5, -22);
    this.build();
  }

  build() {
    const darkTeakMat = new THREE.MeshLambertMaterial({ color: '#3d2516' });
    const woodDeckMat = new THREE.MeshLambertMaterial({ color: '#52341d' });
    const thatchRoofMat = new THREE.MeshLambertMaterial({ color: '#4a3325' });
    const upperRoofMat = new THREE.MeshLambertMaterial({ color: '#2b1a10' });
    const stoneBaseMat = new THREE.MeshLambertMaterial({ color: '#423d3a' });
    const goldOrnamentMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const whiteClothMat = new THREE.MeshLambertMaterial({ color: '#f5f3ef' });
    const maroonBatikMat = new THREE.MeshLambertMaterial({ color: '#66121f' });
    const floralPinkMat = new THREE.MeshLambertMaterial({ color: '#e85d75' });
    const floralWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const fairyGlowMat = new THREE.MeshLambertMaterial({ color: '#fff3b0', emissive: 0x886622 });

    // 1. Raised Stone Foundation & Teak Platform
    const stonePlinth = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.7, 11.5), stoneBaseMat);
    stonePlinth.position.set(0, 0.35, 0);
    this.group.add(stonePlinth);

    const timberDeck = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.18, 11.8), woodDeckMat);
    timberDeck.position.set(0, 0.78, 0);
    this.group.add(timberDeck);

    // Front Entrance Steps (leading down towards terrace path)
    for (let s = 1; s <= 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 0.8), stoneBaseMat);
      step.position.set(0, 0.7 - s * 0.22, 5.9 + (s - 1) * 0.7);
      this.group.add(step);
    }

    // 2. Pillars: 4 Main Central Soko Guru + 8 Perimeter Veranda Columns
    const pillarPositions = [
      // 4 Inner Soko Guru
      { x: -3.6, z: -2.8, isMain: true }, { x: 3.6, z: -2.8, isMain: true },
      { x: -3.6, z: 2.8, isMain: true },  { x: 3.6, z: 2.8, isMain: true },
      // Perimeter Veranda Columns
      { x: -5.8, z: -4.8, isMain: false }, { x: 0, z: -4.8, isMain: false }, { x: 5.8, z: -4.8, isMain: false },
      { x: -5.8, z: 4.8, isMain: false },  { x: 0, z: 4.8, isMain: false },  { x: 5.8, z: 4.8, isMain: false },
      { x: -5.8, z: 0, isMain: false },    { x: 5.8, z: 0, isMain: false }
    ];

    pillarPositions.forEach(pos => {
      const colRadius = pos.isMain ? 0.28 : 0.20;
      const colHeight = pos.isMain ? 5.6 : 4.4;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(colRadius, colRadius * 1.15, colHeight, 10), darkTeakMat);
      col.position.set(pos.x, 0.8 + colHeight / 2, pos.z);
      this.group.add(col);

      // Gold capital & stone base ring
      const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(colRadius * 1.4, colRadius * 1.6, 0.2, 10), stoneBaseMat);
      baseRing.position.set(pos.x, 0.9, pos.z);
      this.group.add(baseRing);

      const capRing = new THREE.Mesh(new THREE.BoxGeometry(colRadius * 2.6, 0.16, colRadius * 2.6), goldOrnamentMat);
      capRing.position.set(pos.x, 0.8 + colHeight, pos.z);
      this.group.add(capRing);
    });

    // 3. Tiered Joglo / Lumbung Roof (Lower Eaves + Upper Tier Steep Peak)
    // Lower Veranda Eaves
    const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(9.6, 2.2, 4), thatchRoofMat);
    lowerRoof.rotation.y = Math.PI / 4;
    lowerRoof.position.set(0, 5.8, 0);
    this.group.add(lowerRoof);

    // Eaves Timber Fascia Trim
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.2, 12.2), darkTeakMat);
    fascia.position.set(0, 4.8, 0);
    this.group.add(fascia);

    // Mid Tier Transition Band
    const midBand = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.6, 6.2), darkTeakMat);
    midBand.position.set(0, 6.5, 0);
    this.group.add(midBand);

    // Upper Steep Joglo Crown Roof
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.2, 4), upperRoofMat);
    upperRoof.rotation.y = Math.PI / 4;
    upperRoof.position.set(0, 8.2, 0);
    this.group.add(upperRoof);

    // Gold Pinnacle Finial (Mustaka)
    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.45, 1.4, 8), goldOrnamentMat);
    finial.position.set(0, 10.1, 0);
    this.group.add(finial);

    const finialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), goldOrnamentMat);
    finialOrb.position.set(0, 10.9, 0);
    this.group.add(finialOrb);

    // 4. Pelaminan (Grand Wedding Stage at Back)
    const stageBackdrop = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.8, 0.4), darkTeakMat);
    stageBackdrop.position.set(0, 2.7, -4.2);
    this.group.add(stageBackdrop);

    // Carved Gold Gebyok Relief Panel
    const gebyokPanel = new THREE.Mesh(new THREE.BoxGeometry(7.4, 3.2, 0.1), goldOrnamentMat);
    gebyokPanel.position.set(0, 2.8, -4.0);
    this.group.add(gebyokPanel);

    // Maroon & Gold Batik Drape
    const batikDrape = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.8, 0.08), maroonBatikMat);
    batikDrape.position.set(0, 2.6, -3.94);
    this.group.add(batikDrape);

    // Couple's Bridal Loveseat / Pelaminan Sofa
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 1.1), whiteClothMat);
    sofaSeat.position.set(0, 1.25, -3.3);
    this.group.add(sofaSeat);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.35), whiteClothMat);
    sofaBack.position.set(0, 1.8, -3.7);
    this.group.add(sofaBack);

    // Gold Trim on Sofa
    const sofaTrim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 0.38), goldOrnamentMat);
    sofaTrim.position.set(0, 2.35, -3.7);
    this.group.add(sofaTrim);

    // Floral Arrangements Flanking the Pelaminan
    for (const side of [-3.8, 3.8]) {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1.6, 8), stoneBaseMat);
      stand.position.set(side, 1.6, -3.3);
      this.group.add(stand);

      // Flower bouquets (Rose & Jasmine)
      for (let i = 0; i < 7; i++) {
        const mat = i % 2 === 0 ? floralPinkMat : floralWhiteMat;
        const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), mat);
        fl.position.set(side + (Math.random() - 0.5) * 0.5, 2.5 + Math.random() * 0.6, -3.3 + (Math.random() - 0.5) * 0.4);
        this.group.add(fl);
      }
    }

    // 5. Warm Glowing Chandelier in Center of Pendopo
    const chandelier = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.8, 0.4, 8), goldOrnamentMat);
    chandelier.position.set(0, 5.0, 0);
    this.group.add(chandelier);

    const chandelierLight = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), fairyGlowMat);
    chandelierLight.position.set(0, 4.6, 0);
    this.group.add(chandelierLight);

    // 6. Festive Warm Fairylights Strung Along Eaves
    const fairyPositions = [
      [-6.5, 4.7, -5.5], [-3.2, 4.6, -5.5], [0, 4.5, -5.5], [3.2, 4.6, -5.5], [6.5, 4.7, -5.5],
      [-6.5, 4.7, 5.5],  [-3.2, 4.6, 5.5],  [0, 4.5, 5.5],  [3.2, 4.6, 5.5],  [6.5, 4.7, 5.5],
      [-6.5, 4.6, -2.5], [-6.5, 4.5, 2.5],  [6.5, 4.6, -2.5], [6.5, 4.5, 2.5]
    ];

    fairyPositions.forEach(([x, y, z]) => {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), fairyGlowMat);
      bulb.position.set(x, y, z);
      this.group.add(bulb);
    });

    // 7. Balustrades along sides
    for (const side of [-6.4, 6.4]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 9.8), darkTeakMat);
      rail.position.set(side, 1.3, 0);
      this.group.add(rail);
    }
  }
}
