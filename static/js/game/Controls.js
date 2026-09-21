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

    // Joystick Vector State
    this.joystickVector = { dx: 0, dy: 0, intensity: 0 };
    this.isJoystickActive = false;
    this.touchId = null;

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

    // 1. Analog Joystick Base & Thumb Knob (Bottom Left)
    const joystickArea = document.createElement('div');
    joystickArea.className = 'joystick-touch-area';

    const joystickBase = document.createElement('div');
    joystickBase.className = 'virtual-joystick-base idle';

    const joystickThumb = document.createElement('div');
    joystickThumb.className = 'virtual-joystick-thumb';
    joystickBase.appendChild(joystickThumb);

    joystickArea.appendChild(joystickBase);
    joystickWrapper.appendChild(joystickArea);

    // Joystick Touch Drag Event Logic
    const maxRadius = 45; // Maximum pixel displacement from base center
    let baseCenter = { x: 0, y: 0 };

    const handleStart = (clientX, clientY, identifier = null) => {
      this.touchId = identifier;
      this.isJoystickActive = true;
      joystickBase.classList.remove('idle');
      joystickBase.classList.add('active');

      const rect = joystickBase.getBoundingClientRect();
      baseCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      handleMove(clientX, clientY);
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isJoystickActive) return;

      let deltaX = clientX - baseCenter.x;
      let deltaY = clientY - baseCenter.y;
      const distance = Math.hypot(deltaX, deltaY);

      // Clamp thumb movement within maxRadius
      const clampedDistance = Math.min(distance, maxRadius);
      const angle = Math.atan2(deltaY, deltaX);

      const thumbX = Math.cos(angle) * clampedDistance;
      const thumbY = Math.sin(angle) * clampedDistance;

      joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

      // Normalized direction vector & intensity (0.0 to 1.0)
      const intensity = clampedDistance / maxRadius;
      this.joystickVector = {
        dx: distance > 5 ? Math.cos(angle) : 0,
        dy: distance > 5 ? Math.sin(angle) : 0,
        intensity: intensity
      };
    };

    const handleEnd = () => {
      this.isJoystickActive = false;
      this.touchId = null;
      joystickBase.classList.remove('active');
      joystickBase.classList.add('idle');

      joystickThumb.style.transform = `translate(0px, 0px)`;
      this.joystickVector = { dx: 0, dy: 0, intensity: 0 };
    };

    // Touch Event Listeners for Mobile
    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.touchId !== null) return;
      const touch = e.changedTouches[0];
      handleStart(touch.clientX, touch.clientY, touch.identifier);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isJoystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!this.isJoystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          handleEnd();
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      if (this.isJoystickActive) handleEnd();
    }, { passive: true });

    // Mouse Fallback for testing in Browser DevTools
    let isMouseDown = false;
    joystickArea.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      handleStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    });

    // 2. Action Buttons Group (Bottom Right)
    const actionGroup = document.createElement('div');
    actionGroup.className = 'action-group';

    // Jump Button
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

    // Action / Interact Button
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
    let intensity = 0;

    // Check keyboard input first
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    if (dx !== 0 || dy !== 0) {
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }
      intensity = 1.0;
    } else if (this.isJoystickActive && this.joystickVector.intensity > 0.05) {
      // Use Analog Virtual Joystick vector
      dx = this.joystickVector.dx;
      dy = this.joystickVector.dy;
      intensity = this.joystickVector.intensity;
    }

    return { dx, dy, intensity, jump: this.keys.jump };
  }
}

