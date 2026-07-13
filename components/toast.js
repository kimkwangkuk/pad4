/* ── Toast Component ───────────────────────────── */
class Toast {
  constructor() {
    this._el = null;
    this._hideTimer = null;
    this._removeTimer = null;
  }

  _build() {
    this._el = document.createElement('div');
    this._el.className = 'toast';
    document.body.appendChild(this._el);
  }

  show(message, duration = 2400) {
    if (!this._el) this._build();

    clearTimeout(this._hideTimer);
    clearTimeout(this._removeTimer);
    this._el.classList.remove('toast-visible', 'toast-hiding');
    this._el.offsetHeight; // force reflow to restart transition

    this._el.textContent = message;
    this._el.classList.add('toast-visible');

    this._hideTimer = setTimeout(() => {
      this._el.classList.replace('toast-visible', 'toast-hiding');
      this._removeTimer = setTimeout(() => {
        this._el.classList.remove('toast-hiding');
      }, 220);
    }, duration);
  }
}

/* Shared singleton — use window.showToast(msg) anywhere */
window.toast = new Toast();
window.showToast = (message, duration) => window.toast.show(message, duration);
