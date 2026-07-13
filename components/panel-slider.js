class PanelSlider {
  constructor(el) {
    this.el = el;
    this.panels = Array.from(el.querySelectorAll(':scope > .pnl-panel'));
    this.count = this.panels.length;
    this.index = 0;
    this.el.style.width = (this.count * 100) + '%';
    this.panels.forEach(p => { p.style.width = (100 / this.count) + '%'; });
  }

  goTo(index) {
    this.index = Math.max(0, Math.min(this.count - 1, index));
    const pct = (100 / this.count) * this.index;
    this.el.style.transform = `translateX(-${pct}%)`;
  }

  reset(index = 0) {
    this.el.style.transition = 'none';
    this.goTo(index);
    this.el.offsetHeight;
    this.el.style.transition = '';
  }
}
