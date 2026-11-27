export interface InputSnapshot {
  moveX: number;
  moveY: number;
  sprint: boolean;
  lookDeltaX: number;
  lookDeltaY: number;
  interactPressed: boolean;
  hornPressed: boolean;
  touchThrottle: boolean;
  touchBrake: boolean;
}

export class InputManager {
  private keys = new Set<string>();
  private joyX = 0;
  private joyY = 0;
  private touchSprint = false;
  private touchThrottle = false;
  private touchBrake = false;
  private pendingLookX = 0;
  private pendingLookY = 0;
  private pendingInteract = false;
  private pendingHorn = false;
  private isDraggingMouse = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private onPauseToggle?: () => void;
  private onPhoneToggle?: () => void;
  private onPhotoToggle?: () => void;
  private canvasEl: HTMLElement | null = null;
  private enabled = false;

  constructor(
    onPauseToggle?: () => void,
    onPhoneToggle?: () => void,
    onPhotoToggle?: () => void
  ) {
    this.onPauseToggle = onPauseToggle;
    this.onPhoneToggle = onPhoneToggle;
    this.onPhotoToggle = onPhotoToggle;
  }

  public attach(canvasEl: HTMLElement): () => void {
    this.canvasEl = canvasEl;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!e.repeat) {
          this.onPauseToggle?.();
        }
        return;
      }
      if (!e.repeat && this.enabled) {
        if (e.code === 'KeyF' || e.code === 'KeyE') {
          this.pendingInteract = true;
        } else if (e.code === 'KeyH') {
          this.pendingHorn = true;
        } else if (e.code === 'KeyM') {
          this.onPhoneToggle?.();
          return;
        } else if (e.code === 'KeyC') {
          this.onPhotoToggle?.();
          return;
        }
      }
      this.keys.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    const onWindowBlur = () => {
      this.clearAll();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.clearAll();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!this.enabled) return;
      if (e.button === 0 || e.button === 2) {
        this.isDraggingMouse = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      this.isDraggingMouse = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.enabled) return;
      if (document.pointerLockElement === this.canvasEl) {
        this.pendingLookX += e.movementX;
        this.pendingLookY += e.movementY;
      } else if (this.isDraggingMouse) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.pendingLookX += dx;
        this.pendingLookY += dy;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (this.enabled) e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    canvasEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvasEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvasEl.removeEventListener('contextmenu', onContextMenu);
      this.canvasEl = null;
    };
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearAll();
      try {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
      } catch {
        // Ignore
      }
    }
  }

  public setJoystick(x: number, y: number): void {
    this.joyX = Math.max(-1, Math.min(1, x));
    this.joyY = Math.max(-1, Math.min(1, y));
  }

  public setTouchSprint(sprint: boolean): void {
    this.touchSprint = sprint;
  }

  public setTouchThrottle(active: boolean): void {
    this.touchThrottle = active;
  }

  public setTouchBrake(active: boolean): void {
    this.touchBrake = active;
  }

  public triggerInteract(): void {
    this.pendingInteract = true;
  }

  public triggerHorn(): void {
    this.pendingHorn = true;
  }

  public addTouchLookDelta(dx: number, dy: number): void {
    if (!this.enabled) return;
    this.pendingLookX += dx * 1.45;
    this.pendingLookY += dy * 1.35;
  }

  public clearAll(): void {
    this.keys.clear();
    this.joyX = 0;
    this.joyY = 0;
    this.touchSprint = false;
    this.touchThrottle = false;
    this.touchBrake = false;
    this.isDraggingMouse = false;
    this.pendingLookX = 0;
    this.pendingLookY = 0;
    this.pendingInteract = false;
    this.pendingHorn = false;
  }

  public consumeSnapshot(): InputSnapshot {
    let kbX = 0;
    let kbY = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kbX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kbX += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kbY += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kbY -= 1;

    let moveX = kbX + this.joyX;
    let moveY = kbY + this.joyY;
    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    const sprint =
      this.touchSprint || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    const lookDeltaX = this.pendingLookX;
    const lookDeltaY = this.pendingLookY;
    const interactPressed = this.pendingInteract;
    const hornPressed = this.pendingHorn;

    this.pendingLookX = 0;
    this.pendingLookY = 0;
    this.pendingInteract = false;
    this.pendingHorn = false;

    return {
      moveX,
      moveY,
      sprint,
      lookDeltaX,
      lookDeltaY,
      interactPressed,
      hornPressed,
      touchThrottle: this.touchThrottle,
      touchBrake: this.touchBrake,
    };
  }
}
