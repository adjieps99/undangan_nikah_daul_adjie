import * as THREE from 'three';
import { ASSET_MANIFEST } from '../../config/assetManifest.js';

export class PhotoGallery {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(18, 2.0, 8);
    this.group.rotation.y = -Math.PI / 2;
    this.frameMeshes = [];
    this.buildGallery();
    this.loadRealGalleryThumbnails();
  }

  buildGallery() {
    const woodMat = new THREE.MeshLambertMaterial({ color: '#3e2717' });
    const wallMat = new THREE.MeshLambertMaterial({ color: '#ece4d4' });
    const frameMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    const lightMat = new THREE.MeshLambertMaterial({ color: '#ffea88', emissive: 0xaa7711 });

    // 1. Curved Stone Plinth Base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.25, 4.5), new THREE.MeshLambertMaterial({ color: '#7a7066' }));
    plinth.position.y = 0.12;
    this.group.add(plinth);

    // 2. Exhibition Gallery Back Wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.2, 0.3), wallMat);
    wall.position.set(0, 1.7, -1.2);
    this.group.add(wall);

    // Timber Wall Cap & Framing
    const wallCap = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.25, 0.5), woodMat);
    wallCap.position.set(0, 3.35, -1.2);
    this.group.add(wallCap);

    // 3. 3 Ornate Framed Canvases along Wall
    const photoOffsets = [-2.4, 0, 2.4];
    const photoColors = ['#ff9a9e', '#a1c4fd', '#fbc2eb'];

    photoOffsets.forEach((px, i) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 0.08), frameMat);
      frame.position.set(px, 1.8, -1.0);
      this.group.add(frame);

      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.1),
        new THREE.MeshLambertMaterial({ color: photoColors[i] })
      );
      canvas.position.set(px, 1.8, -0.95);
      this.group.add(canvas);
      this.frameMeshes.push(canvas);

      // Dedicated Overhead Gallery Spotlight
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.25, 8), woodMat);
      spot.rotation.x = Math.PI / 4;
      spot.position.set(px, 2.7, -0.8);
      this.group.add(spot);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lightMat);
      bulb.position.set(px, 2.62, -0.72);
      this.group.add(bulb);
    });

    // 4. Front Floral Box Planter
    const planterBox = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.45, 0.6), woodMat);
    planterBox.position.set(0, 0.35, 1.4);
    this.group.add(planterBox);

    const foliageMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#ffb3c1' });

    for (let f = -3.5; f <= 3.5; f += 0.8) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), foliageMat);
      bush.position.set(f, 0.7, 1.4);
      this.group.add(bush);

      const blm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flowerMat);
      blm.position.set(f, 0.95, 1.4);
      this.group.add(blm);
    }
  }

  loadRealGalleryThumbnails() {
    if (typeof fetch !== 'function') return;
    fetch(ASSET_MANIFEST.images.gallery.apiEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.photos) || data.photos.length === 0) return;
        const loader = new THREE.TextureLoader();
        data.photos.slice(0, this.frameMeshes.length).forEach((photo, idx) => {
          loader.load(photo.url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.needsUpdate = true;
            const targetMesh = this.frameMeshes[idx];
            if (!targetMesh) return;

            const imgWidth = tex.image?.naturalWidth || tex.image?.width || 0;
            const imgHeight = tex.image?.naturalHeight || tex.image?.height || 0;
            if (imgWidth > 0 && imgHeight > 0) {
              const frameAspect = 1.4 / 1.1;
              const imgAspect = imgWidth / imgHeight;
              if (imgAspect > frameAspect) {
                targetMesh.scale.set(1, frameAspect / imgAspect, 1);
              } else {
                targetMesh.scale.set(imgAspect / frameAspect, 1, 1);
              }
            }

            targetMesh.material?.dispose?.();
            targetMesh.material = new THREE.MeshLambertMaterial({ map: tex, color: '#ffffff' });
          });
        });
      })
      .catch(() => {});
  }
}
