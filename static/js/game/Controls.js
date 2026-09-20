export class Controls {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false
    };

    this.touchVector = { x: 0, y: 0 };
    this.setupKeyboardListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.up = true;
          break;
        case 's':
        case 'arrowdown':
          this.keys.down = true;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = true;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = true;
          break;
        case 'e':
        case ' ':
          this.keys.interact = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.up = false;
          break;
        case 's':
        case 'arrowdown':
          this.keys.down = false;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = false;
          break;
        case 'e':
        case ' ':
          this.keys.interact = false;
          break;
      }
    });
  }

  createVirtualJoystick(container) {
    const joystickWrapper = document.createElement('div');
    joystickWrapper.className = 'virtual-joystick-wrapper';

    const dpad = document.createElement('div');
    dpad.className = 'virtual-dpad';

    const dirs = ['up', 'left', 'right', 'down'];
    dirs.forEach(dir => {
      const btn = document.createElement('button');
      btn.className = `dpad-btn dpad-${dir}`;
      btn.innerText = dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◄' : '►';

      const setDir = (val) => { this.keys[dir] = val; };

      btn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir(true); });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); setDir(false); });
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); setDir(true); });
      btn.addEventListener('mouseup', (e) => { e.preventDefault(); setDir(false); });

      dpad.appendChild(btn);
    });

    const interactBtn = document.createElement('button');
    interactBtn.className = 'virtual-action-btn';
    interactBtn.innerText = 'E';
    interactBtn.title = 'Interact';

    interactBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.triggerInteract(); });
    interactBtn.addEventListener('click', (e) => { e.preventDefault(); this.triggerInteract(); });

    joystickWrapper.appendChild(dpad);
    joystickWrapper.appendChild(interactBtn);
    container.appendChild(joystickWrapper);
  }

  triggerInteract() {
    window.dispatchEvent(new CustomEvent('player-interact'));
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    return { dx, dy };
  }
}
