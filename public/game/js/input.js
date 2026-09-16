const Input = {
  keys: new Set(),
  pressed: new Set(),
  mouseButtons: new Set(),
  mousePressed: new Set(),
  mouseX: 0,
  mouseY: 0,

  init() {
    window.addEventListener("keydown", e => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (["w","a","s","d","j","k","l","f3","escape"," ","shift"].includes(k)) e.preventDefault();
      if (e.key === "F3") this.pressed.add("f3");
      if (e.key === "Escape") this.pressed.add("escape");
    });

    window.addEventListener("keyup", e => this.keys.delete(e.key.toLowerCase()));

    window.addEventListener("mousedown", e => {
      // Controles da interface usam o comportamento nativo do navegador.
      const target = e.target;
      const isInterfaceControl = target && (
        target.matches?.("input, button, label, select, textarea") ||
        target.closest?.("input, button, label, select, textarea")
      );
      if (isInterfaceControl) return;

      try { window.focus(); } catch (_) {}
      this.updateMousePosition(e);
      this.mouseButtons.add(e.button);
      this.mousePressed.add(e.button);
      if (e.button === 0 || e.button === 2) e.preventDefault();
    });

    // Mantém sliders e outros controles responsivos em mouse, toque e caneta.
    window.addEventListener("pointerdown", e => {
      const target = e.target;
      const isInterfaceControl = target && target.closest?.("input, button, label, select, textarea");
      if (isInterfaceControl) return;
      try { window.focus(); } catch (_) {}
    }, { passive: true });

    window.addEventListener("pointerenter", () => { try { window.focus(); } catch (_) {} });
    document.addEventListener("mouseenter", () => { try { window.focus(); } catch (_) {} });

    window.addEventListener("mouseup", e => this.mouseButtons.delete(e.button));
    window.addEventListener("mousemove", e => this.updateMousePosition(e));
    window.addEventListener("contextmenu", e => {
      const target = e.target;
      const isInterfaceControl = target && target.closest?.("input, button, label, select, textarea");
      if (!isInterfaceControl) e.preventDefault();
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.pressed.clear();
      this.mouseButtons.clear();
      this.mousePressed.clear();
    });
  },

  updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  },

  down(k) { return this.keys.has(k); },
  mouseDown(button) { return this.mouseButtons.has(button); },

  consume(k) {
    if (this.pressed.has(k)) {
      this.pressed.delete(k);
      return true;
    }
    return false;
  },

  consumeMouse(button) {
    if (this.mousePressed.has(button)) {
      this.mousePressed.delete(button);
      return true;
    }
    return false;
  },

  endFrame() {
    this.pressed.clear();
    this.mousePressed.clear();
  }
};
