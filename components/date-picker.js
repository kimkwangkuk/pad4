class DatePicker {
  constructor(options = {}) {
    const today = new Date();
    this.year = options.year || today.getFullYear();
    this.month = options.month || today.getMonth() + 1;
    this.selected = options.selected || null;
    this.onConfirm = options.onConfirm || null;
    this._overlay = null;
    this._sheet = null;
    this.takenDates = new Set(
      (options.takenDates || []).map(d => `${d.year}-${d.month}-${d.day}`)
    );
  }

  _buildSheet() {
    const sheet = document.createElement('div');
    sheet.className = 'dp-sheet';
    sheet.innerHTML = `
      <div class="bsm-header">
        <button class="dp-header-confirm-btn" disabled><i data-lucide="check" style="width:16px;height:16px;color:#fff;"></i></button>
        <span class="bsm-title">날짜 선택</span>
        <button class="dp-close-btn bsm-close-btn">
          <i data-lucide="x" style="width:20px;height:20px;color:rgba(0,0,0,0.6);"></i>
        </button>
      </div>
      <div class="dp-content">
        <div class="dp-calendar">
          <div class="dp-month-nav">
            <button class="dp-nav-btn dp-prev">
              <i data-lucide="chevron-left" style="width:20px;height:20px;color:rgba(0,0,0,0.86);"></i>
            </button>
            <span class="dp-month-title"></span>
            <button class="dp-nav-btn dp-next">
              <i data-lucide="chevron-right" style="width:20px;height:20px;color:rgba(0,0,0,0.86);"></i>
            </button>
          </div>
          <div class="dp-grid">
            <div class="dp-day-headers">
              <div class="dp-day-header">월</div>
              <div class="dp-day-header">화</div>
              <div class="dp-day-header">수</div>
              <div class="dp-day-header">목</div>
              <div class="dp-day-header">금</div>
              <div class="dp-day-header">토</div>
              <div class="dp-day-header">일</div>
            </div>
            <div class="dp-dates"></div>
          </div>
        </div>
      </div>
    `;

    sheet.querySelector('.dp-close-btn').addEventListener('click', () => this.close());
    sheet.querySelector('.dp-header-confirm-btn').addEventListener('click', () => {
      if (this.selected == null) return;
      if (this.onConfirm) this.onConfirm({ year: this.year, month: this.month, day: this.selected });
      this.close();
    });
    sheet.querySelector('.dp-prev').addEventListener('click', () => {
      this.month--;
      if (this.month < 1) { this.month = 12; this.year--; }
      this.selected = null;
      this._renderGrid(sheet);
    });
    sheet.querySelector('.dp-next').addEventListener('click', () => {
      this.month++;
      if (this.month > 12) { this.month = 1; this.year++; }
      this.selected = null;
      this._renderGrid(sheet);
    });
    this._renderGrid(sheet);

    return sheet;
  }

  _renderGrid(sheet) {
    sheet.querySelector('.dp-month-title').textContent = `${this.year}년 ${this.month}월`;
    const grid = sheet.querySelector('.dp-dates');
    grid.innerHTML = '';
    const firstDay = new Date(this.year, this.month - 1, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(this.year, this.month, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i += 7) {
      const row = document.createElement('div');
      row.className = 'dp-week-row';
      for (let j = 0; j < 7; j++) {
        const day = (i + j) - startOffset + 1;
        const valid = day >= 1 && day <= daysInMonth;
        const taken = valid && this.takenDates.has(`${this.year}-${this.month}-${day}`);
        const cell = document.createElement('div');
        cell.className = 'dp-day-cell' + (valid ? '' : ' empty') + (taken ? ' taken' : '');
        const sel = (day === this.selected && !taken) ? ' selected' : '';
        const circleCls = `dp-day-circle${sel}${taken ? ' taken' : ''}`;
        cell.innerHTML = `<div class="${circleCls}"><span class="dp-day-num">${valid ? day : ''}</span></div>`;
        if (valid && !taken) {
          cell.addEventListener('click', () => {
            this.selected = day;
            this._renderGrid(sheet); // 선택 표시만 갱신 — 확인 버튼을 눌러야 실제로 확정된다
          });
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    const confirmBtn = sheet.querySelector('.dp-header-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = this.selected == null;
  }

  open() {
    if (!this._overlay) {
      this._overlay = document.createElement('div');
      this._overlay.className = 'dp-overlay dp-hidden';
      this._sheet = this._buildSheet();
      this._overlay.appendChild(this._sheet);
      document.body.appendChild(this._overlay);
      if (window.lucide) lucide.createIcons({ nodes: [this._sheet] });
      this._overlay.addEventListener('click', (e) => {
        if (e.target === this._overlay) this.close();
      });
    }
    this._renderGrid(this._sheet);
    this._overlay.classList.remove('dp-hidden');
  }

  close() {
    if (this._overlay) this._overlay.classList.add('dp-hidden');
  }

  mount(container) {
    this._sheet = this._buildSheet();
    container.appendChild(this._sheet);
    if (window.lucide) lucide.createIcons({ nodes: [this._sheet] });
  }

  refresh() {
    if (this._sheet) this._renderGrid(this._sheet);
  }
}
