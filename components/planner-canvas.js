class PlannerCanvas {
  constructor(el) {
    this.el = el;
    this._state = el.dataset.canvasState || 'with-date';
  }

  setState(state) {
    this._state = state;
    this.el.dataset.canvasState = state;

    const dateEl  = this.el.querySelector('.hd-date-val');
    const ddayEl  = this.el.querySelector('.hd-dday-val');
    const timeEl  = this.el.querySelector('.hd-time-val');

    if (state === 'no-date') {
      if (dateEl) dateEl.textContent = '--.--.--';
      if (ddayEl) ddayEl.textContent = '--';
      if (timeEl) timeEl.textContent = '--:--:--';
    }
  }

  getState() {
    return this._state;
  }
}
