/* ── Dialog Component ───────────────────────────────────────── */
class Dialog {
  constructor({ title, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel } = {}) {
    this._title = title;
    this._message = message;
    this._confirmLabel = confirmLabel;
    this._cancelLabel = cancelLabel;
    this._onConfirm = onConfirm;
    this._onCancel = onCancel;
    this._backdrop = null;
    this._wrap = null;
  }

  _build() {
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'dlg-backdrop';

    this._wrap = document.createElement('div');
    this._wrap.className = 'dlg-wrap';
    this._wrap.innerHTML = `
      <div class="dlg">
        <div class="dlg-glass"></div>
        <div class="dlg-container">
          <p class="dlg-title">${this._title || ''}</p>
          ${this._message ? `<p class="dlg-message">${this._message}</p>` : ''}
        </div>
        <div class="dlg-buttons">
          <button class="dlg-btn dlg-cancel">${this._cancelLabel}</button>
          <button class="dlg-btn dlg-confirm">${this._confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this._backdrop);
    document.body.appendChild(this._wrap);

    this._wrap.querySelector('.dlg-cancel').addEventListener('click', () => {
      this.close();
      this._onCancel?.();
    });
    this._wrap.querySelector('.dlg-confirm').addEventListener('click', () => {
      this.close();
      this._onConfirm?.();
    });
    this._backdrop.addEventListener('click', () => {
      this.close();
      this._onCancel?.();
    });
  }

  open() {
    if (!this._wrap) this._build();
    // force reflow for transition
    this._backdrop.offsetHeight;
    this._backdrop.classList.add('dlg-visible');
    this._wrap.classList.add('dlg-visible');
  }

  close() {
    this._backdrop?.classList.remove('dlg-visible');
    this._wrap?.classList.remove('dlg-visible');
  }

  /* Update options after construction */
  update({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel } = {}) {
    if (title !== undefined) this._title = title;
    if (message !== undefined) this._message = message;
    if (confirmLabel !== undefined) this._confirmLabel = confirmLabel;
    if (cancelLabel !== undefined) this._cancelLabel = cancelLabel;
    if (onConfirm !== undefined) this._onConfirm = onConfirm;
    if (onCancel !== undefined) this._onCancel = onCancel;
    // Rebuild DOM on next open if already built
    if (this._wrap) {
      this._wrap.querySelector('.dlg-title').textContent = this._title || '';
      const msgEl = this._wrap.querySelector('.dlg-message');
      if (msgEl) msgEl.textContent = this._message || '';
      this._wrap.querySelector('.dlg-cancel').textContent = this._cancelLabel;
      this._wrap.querySelector('.dlg-confirm').textContent = this._confirmLabel;
    }
  }
}
