/**
 * EnvironmentSVG - Reusable SVG Environment Objects Foundation
 */
export function generateTreeSVG(width = 64, height = 64) {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="shape-rendering: crispEdges;">
      <!-- Tree Shadow -->
      <ellipse cx="16" cy="30" rx="12" ry="2" fill="rgba(0,0,0,0.3)" />
      
      <!-- Trunk -->
      <rect x="13" y="18" width="6" height="12" fill="#5c4033" />
      <rect x="14" y="20" width="2" height="10" fill="#3d2b22" />

      <!-- Foliage Bottom Layer -->
      <rect x="6" y="12" width="20" height="8" fill="#1b4332" />
      <!-- Foliage Middle Layer -->
      <rect x="8" y="7" width="16" height="7" fill="#2d6a4f" />
      <!-- Foliage Top Layer -->
      <rect x="11" y="3" width="10" height="5" fill="#40916c" />

      <!-- Highlights / Flowers on Tree -->
      <rect x="9" y="9" width="2" height="2" fill="#ffb703" />
      <rect x="19" y="11" width="2" height="2" fill="#ff4d6d" />
      <rect x="14" y="5" width="2" height="2" fill="#ffb703" />
    </svg>
  `;
}
