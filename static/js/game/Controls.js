export class Controls {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false,
      jump: false
    };

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
          this.keys.interact = true;
          break;
        case ' ':
          this.keys.jump = true;
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
          this.keys.interact = false;
          break;
        case ' ':
          this.keys.jump = false;
          break;
      }
    });
  }

  createVirtualJoystick(container) {
    const existing = container.querySelector('.virtual-joystick-wrapper');
    if (existing) existing.remove();

    const joystickWrapper = document.createElement('div');
    joystickWrapper.className = 'virtual-joystick-wrapper';

    // 1. D-Pad Group (Bottom Left)
    const dpadGroup = document.createElement('div');
    dpadGroup.className = 'dpad-group';

    const moveLabel = document.createElement('div');
    moveLabel.className = 'control-badge-label';
    moveLabel.innerText = 'MOVE';
    dpadGroup.appendChild(moveLabel);

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

    dpadGroup.appendChild(dpad);
    joystickWrapper.appendChild(dpadGroup);

    // 2. Action Buttons Group (Bottom Right)
    const actionGroup = document.createElement('div');
    actionGroup.className = 'action-group';

    // Jump Button (Top right)
    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'virtual-btn virtual-jump-btn';
    jumpBtn.innerHTML = '<span>🦘</span><label>JUMP</label>';

    const triggerJump = () => {
      this.keys.jump = true;
      setTimeout(() => { this.keys.jump = false; }, 150);
      window.dispatchEvent(new CustomEvent('player-jump'));
    };

    jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerJump(); });
    jumpBtn.addEventListener('click', (e) => { e.preventDefault(); triggerJump(); });
    actionGroup.appendChild(jumpBtn);

    // Interact / Action Button (Bottom right)
    const interactBtn = document.createElement('button');
    interactBtn.className = 'virtual-btn virtual-action-btn';
    interactBtn.innerHTML = '<span>✨</span><label>ACTION</label>';

    interactBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.triggerInteract(); });
    interactBtn.addEventListener('click', (e) => { e.preventDefault(); this.triggerInteract(); });
    actionGroup.appendChild(interactBtn);

    joystickWrapper.appendChild(actionGroup);
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

    return { dx, dy, jump: this.keys.jump };
  }
}
