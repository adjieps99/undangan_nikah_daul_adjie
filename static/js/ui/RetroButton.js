/**
 * RetroButton - Reusable DOM Retro Button Generator
 */
export function createRetroButton({ text = 'Button', onClick = null, className = '', variant = 'primary' }) {
  const button = document.createElement('button');
  button.className = `retro-btn retro-btn-${variant} ${className}`;
  button.innerText = text;

  if (typeof onClick === 'function') {
    button.addEventListener('click', onClick);
  }

  return button;
}
