/**
 * PixelBox - Reusable DOM Pixel Frame Container
 */
export function createPixelBox({ title = '', content = '', className = '' }) {
  const container = document.createElement('div');
  container.className = `pixel-box ${className}`;

  if (title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'pixel-box-title';
    titleEl.style.color = 'var(--color-gold-light)';
    titleEl.style.marginBottom = '12px';
    titleEl.style.fontSize = '16px';
    titleEl.style.fontFamily = 'var(--font-pixel)';
    titleEl.innerText = title;
    container.appendChild(titleEl);
  }

  if (typeof content === 'string') {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'pixel-box-body';
    bodyEl.innerHTML = content;
    container.appendChild(bodyEl);
  } else if (content instanceof HTMLElement) {
    container.appendChild(content);
  }

  return container;
}
