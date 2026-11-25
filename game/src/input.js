// Input: keyboard state and the interact key. Arrow/WASD move, Space/E interact,
// Q drops whatever is held on the nearest counter.
export class Input {
  constructor(target = window) {
    this.keys = new Set();
    this.interactPressed = false;   // edge-triggered
    this.dropPressed = false;
    this.pausePressed = false;
    target.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      this.keys.add(k);
      if (k === ' ' || k === 'e') this.interactPressed = true;
      if (k === 'q') this.dropPressed = true;
      if (k === 'p') this.pausePressed = true;
    });
    target.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  axis() {
    let dx = 0, dy = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1;
    return { dx, dy };
  }

  consumeInteract() {
    const v = this.interactPressed;
    this.interactPressed = false;
    return v;
  }

  consumeDrop() {
    const v = this.dropPressed;
    this.dropPressed = false;
    return v;
  }

  consumePause() {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }
}
