import { gameState, MODALS } from '../state/GameState.js';

export function createModal({ id = 'modal', title = 'Modal Title', content = '', onClose = null, hideCloseBtn = false }) {
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

  let isClosed = false;

  const escListener = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    if (isClosed) return;
    isClosed = true;
    window.removeEventListener('keydown', escListener);

    if (typeof onClose === 'function') {
      onClose();
    } else {
      gameState.setModal(MODALS.NONE);
    }
  };

  // Expose cleanup function on backdrop DOM node for host lifecycle managers
  backdrop._cleanup = handleClose;

  header.appendChild(titleEl);
  if (!hideCloseBtn) {
    closeBtn.addEventListener('click', handleClose);
    header.appendChild(closeBtn);
  }
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
  window.addEventListener('keydown', escListener);

  return backdrop;
}
