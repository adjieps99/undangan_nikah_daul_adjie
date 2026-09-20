import { gameState, MODALS } from '../state/GameState.js';

export function createModal({ id = 'modal', title = 'Modal Title', content = '', onClose = null }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modalContainer = document.createElement('div');
  modalContainer.className = 'pixel-box modal-box';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.innerText = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.innerText = '✖';

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      gameState.setModal(MODALS.NONE);
    }
  };

  closeBtn.addEventListener('click', handleClose);

  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  modalContainer.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  modalContainer.appendChild(body);
  backdrop.appendChild(modalContainer);

  // Backdrop Click to close
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) handleClose();
  });

  // ESC key listener
  const escListener = (e) => {
    if (e.key === 'Escape') {
      handleClose();
      window.removeEventListener('keydown', escListener);
    }
  };
  window.addEventListener('keydown', escListener);

  return backdrop;
}
