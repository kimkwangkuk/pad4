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

  /* opts.actionLabel/opts.onAction — 메시지 옆에 액션 버튼(예: "되돌리기")을 붙인다.
     버튼을 누르면 토스트를 즉시 닫고 onAction을 실행한다. */
  show(message, duration = 2400, opts = {}) {
    if (!this._el) this._build();

    clearTimeout(this._hideTimer);
    clearTimeout(this._removeTimer);
    this._el.classList.remove('toast-visible', 'toast-hiding');
    this._el.offsetHeight; // force reflow to restart transition

    this._el.textContent = message;
    if (opts.actionLabel) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-action';
      btn.textContent = opts.actionLabel;
      btn.addEventListener('click', () => {
        this.hide();
        opts.onAction?.();
      });
      this._el.appendChild(btn);
    }
    this._el.classList.add('toast-visible');

    this._hideTimer = setTimeout(() => this.hide(), duration);
  }

  hide() {
    if (!this._el) return;
    clearTimeout(this._hideTimer);
    clearTimeout(this._removeTimer);
    this._el.classList.replace('toast-visible', 'toast-hiding');
    this._removeTimer = setTimeout(() => {
      this._el.classList.remove('toast-hiding');
    }, 220);
  }
}

/* Shared singleton — use window.showToast(msg) anywhere */
window.toast = new Toast();
window.showToast = (message, duration) => window.toast.show(message, duration);
