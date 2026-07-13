class SidePanel {
  constructor(el) {
    this.el = el;
    this._open = false;
  }

  toggle() {
    this._open = !this._open;
    this.el.classList.toggle('open', this._open);
  }

  open() {
    this._open = true;
    this.el.classList.add('open');
  }

  close() {
    this._open = false;
    this.el.classList.remove('open');
  }

  isOpen() {
    return this._open;
  }
}
