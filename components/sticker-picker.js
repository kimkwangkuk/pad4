/* ── StickerPicker component ─────────────────────── */
class StickerPicker {
  constructor() {
    this._open = false;
    this._anchor = null;
    this._build();
  }

  _build() {
    const STICKERS = [
      '⭐','🔥','💡','📌',
      '✅','❌','🎯','📎',
      '💬','🏷️','🔖','📝',
      '🌟','💫','✨','🎀',
      '🐾','🌿','🍀','🌸',
    ];

    this._backdrop = document.createElement('div');
    this._backdrop.className = 'sp-picker-backdrop';
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    this._popup = document.createElement('div');
    this._popup.className = 'sp-picker-popup';

    const rows = [];
    for (let r = 0; r < 5; r++) {
      const cells = STICKERS.slice(r * 4, r * 4 + 4)
        .map(s => `<div class="sp-picker-cell" data-sticker="${s}">${s}</div>`)
        .join('');
      rows.push(`<div class="sp-picker-row">${cells}</div>`);
    }

    this._popup.innerHTML = `
      <div class="sp-picker-glass"></div>
      <div class="sp-picker-content">${rows.join('')}</div>
    `;

    this._popup.addEventListener('click', e => {
      const cell = e.target.closest('.sp-picker-cell');
      if (cell) this._onSelect(cell.dataset.sticker);
    });

    document.body.appendChild(this._popup);
  }

  _onSelect(sticker) {
    if (this.onSelect) this.onSelect(sticker);
  }

  _position(anchor) {
    const r = anchor.getBoundingClientRect();
    const W = 316;
    let left = r.left + r.width / 2 - W / 2;
    const top  = r.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
    this._popup.style.left = left + 'px';
    this._popup.style.top  = top  + 'px';
  }

  open(anchor) {
    this._anchor = anchor;
    this._position(anchor);
    this._popup.classList.add('open');
    this._backdrop.classList.add('open');
    document.body.classList.add('sp-picker-open');
    this._open = true;
  }

  close() {
    this._popup.classList.remove('open');
    this._backdrop.classList.remove('open');
    document.body.classList.remove('sp-picker-open');
    this._open = false;
  }

  toggle(anchor) {
    this._open ? this.close() : this.open(anchor);
  }
}
