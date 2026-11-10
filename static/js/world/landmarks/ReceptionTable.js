import * as THREE from 'three';

/**
 * ReceptionTable - Area Tamu: Bale Tradisional & Meja Resepsi
 * Mid-terrace guest area featuring traditional thatched pavilion, dining tables,
 * festoon fairylights, and RSVP registration desk.
 */
export class ReceptionTable {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(16, 2.2, 2);
    this.build();
  }

  build() {
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#4a301d' });
    const deckMat = new THREE.MeshLambertMaterial({ color: '#593d28' });
    const stoneBaseMat = new THREE.MeshLambertMaterial({ color: '#453f3c' });
    const thatchRoofMat = new THREE.MeshLambertMaterial({ color: '#3d2b20' });
    const ivoryClothMat = new THREE.MeshLambertMaterial({ color: '#f8f6f0' });
    const maroonClothMat = new THREE.MeshLambertMaterial({ color: '#7a1c2b' });
    const goldMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const floralPinkMat = new THREE.MeshLambertMaterial({ color: '#e85d75' });
    const leafGreenMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    const fairyGlowMat = new THREE.MeshLambertMaterial({ color: '#fff3b0', emissive: 0x997722 });

    // 1. Raised Wooden Deck Base
    const deck = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.25, 9.5), deckMat);
    deck.position.set(0, 0.12, 0);
    this.group.add(deck);

    // Stone footing
    const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.2, 9.1), stoneBaseMat);
    stoneBase.position.set(0, -0.08, 0);
    this.group.add(stoneBase);

    // Entrance Steps
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.8), stoneBaseMat);
    step.position.set(0, 0.05, 5.1);
    this.group.add(step);

    // 2. Timber Posts (Bale Pavilion)
    const postPositions = [
      [-4.8, -4.0], [0, -4.0], [4.8, -4.0],
      [-4.8, 4.0],  [0, 4.0],  [4.8, 4.0],
      [-4.8, 0],    [4.8, 0]
    ];

    postPositions.forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.8, 8), darkWoodMat);
      post.position.set(x, 2.0, z);
      this.group.add(post);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), stoneBaseMat);
      foot.position.set(x, 0.25, z);
      this.group.add(foot);
    });

    // 3. Thatched Roof (Bale Sasak / Saung Sunda)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 2.6, 4), thatchRoofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 4.8, 0);
    this.group.add(roof);

    // Wooden Ridge Finial
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 6.5), darkWoodMat);
    ridge.position.set(0, 5.9, 0);
    this.group.add(ridge);

    // 4. RSVP Desk (Front Right)
    const rsvpDesk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.2), maroonClothMat);
    rsvpDesk.position.set(-1.8, 0.65, 2.8);
    this.group.add(rsvpDesk);

    const deskTopTrim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 1.3), goldMat);
    deskTopTrim.position.set(-1.8, 1.18, 2.8);
    this.group.add(deskTopTrim);

    // Guestbook Ledger on Desk
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), ivoryClothMat);
    book.position.set(-1.8, 1.24, 2.8);
    this.group.add(book);

    // Signboard on Desk ("BUKU TAMU & RSVP")
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.08), goldMat);
    signBoard.position.set(-1.8, 1.55, 3.1);
    this.group.add(signBoard);

    // 5. Round Guest Dining Tables with Chairs & Centerpieces
    const tablePositions = [
      { x: -2.4, z: -1.6 },
      { x: 2.4, z: -1.6 },
      { x: 2.2, z: 2.2 }
    ];

    tablePositions.forEach(tp => {
      // Round Table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12), ivoryClothMat);
      table.position.set(tp.x, 0.65, tp.z);
      this.group.add(table);

      // Gold Table Runner Disc
      const runner = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 12), goldMat);
      runner.position.set(tp.x, 1.07, tp.z);
      this.group.add(runner);

      // Flower Centerpiece
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8), stoneBaseMat);
      vase.position.set(tp.x, 1.26, tp.z);
      this.group.add(vase);

      const bouquet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), floralPinkMat);
      bouquet.position.set(tp.x, 1.5, tp.z);
      this.group.add(bouquet);

      // 4 Chairs around each table
      for (let c = 0; c < 4; c++) {
        const angle = (c * Math.PI) / 2;
        const cx = tp.x + Math.cos(angle) * 1.7;
        const cz = tp.z + Math.sin(angle) * 1.7;

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), darkWoodMat);
        seat.position.set(cx, 0.5, cz);
        this.group.add(seat);

        const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), ivoryClothMat);
        seatCushion.position.set(cx, 0.58, cz);
        this.group.add(seatCushion);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), darkWoodMat);
        leg.position.set(cx, 0.25, cz);
        this.group.add(leg);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.08), darkWoodMat);
        back.position.set(cx + Math.cos(angle) * 0.22, 0.85, cz + Math.sin(angle) * 0.22);
        this.group.add(back);
      }
    });

    // 6. Warm Fairylights along the Eaves
    for (let i = -5.0; i <= 5.0; i += 1.8) {
      const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), fairyGlowMat);
      f1.position.set(i, 3.6, -4.4);
      this.group.add(f1);

      const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), fairyGlowMat);
      f2.position.set(i, 3.6, 4.4);
      this.group.add(f2);
    }
  }
}
