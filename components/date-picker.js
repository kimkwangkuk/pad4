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
    this.range = null; // {start, end} — 각각 {year, month, day}. 설정 시 범위 밖 날짜는 비활성화
  }

  // 선택 가능한 날짜 범위 설정 — null을 넘기면 제한 해제
  setRange(start, end) {
    this.range = start && end ? { start, end } : null;
  }

  _inRange(day) {
    if (!this.range) return true;
    const v = this.year * 10000 + this.month * 100 + day;
    const s = this.range.start, e = this.range.end;
    return v >= s.year * 10000 + s.month * 100 + s.day
        && v <= e.year * 10000 + e.month * 100 + e.day;
  }

  _buildSheet() {
    const sheet = document.createElement('div');
    sheet.className = 'dp-sheet';
    sheet.innerHTML = `
      <div class="dp-topbar">
        <div class="dp-grabber"></div>
        <div class="dp-header">
          <button class="dp-close-btn">
            <i data-lucide="x" style="width:14px;height:14px;color:rgba(0,0,0,0.5);"></i>
          </button>
          <button class="dp-header-confirm-btn" disabled><i data-lucide="check" style="width:16px;height:16px;color:#fff;"></i></button>
          <span class="dp-title">날짜 선택</span>
        </div>
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
    const _now = new Date(); // 오늘 날짜 셀 표시용
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
        const disabled = valid && !this._inRange(day); // 선택 가능 범위(노트 기간) 밖
        const isToday = valid && this.year === _now.getFullYear()
          && this.month === _now.getMonth() + 1 && day === _now.getDate();
        const cell = document.createElement('div');
        cell.className = 'dp-day-cell' + (valid ? '' : ' empty') + (taken ? ' taken' : '') + (disabled ? ' disabled' : '');
        const sel = (day === this.selected && !taken && !disabled) ? ' selected' : '';
        const circleCls = `dp-day-circle${sel}${taken ? ' taken' : ''}${disabled ? ' disabled' : ''}${isToday ? ' today' : ''}`;
        cell.innerHTML = `<div class="${circleCls}"><span class="dp-day-num">${valid ? day : ''}</span></div>`;
        if (valid && !taken && !disabled) {
          cell.addEventListener('click', () => {
            this.selected = day;
            this._renderGrid(sheet); // 선택 표시만 갱신 — 확인 버튼을 눌러야 실제로 확정된다
          });
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    // 범위가 설정되어 있으면 범위 밖 달로는 아예 이동하지 못하게 화살표를 잠근다
    const ym = this.year * 100 + this.month;
    const prevBtn = sheet.querySelector('.dp-prev');
    const nextBtn = sheet.querySelector('.dp-next');
    if (prevBtn && nextBtn) {
      prevBtn.disabled = !!this.range && ym <= this.range.start.year * 100 + this.range.start.month;
      nextBtn.disabled = !!this.range && ym >= this.range.end.year * 100 + this.range.end.month;
    }

    const confirmBtn = sheet.querySelector('.dp-header-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = this.selected == null;
  }

  /* opts.anchor = {x, y}: 화면 중앙 대신 그 좌표 위쪽에 시트를 붙인다(공간이 없으면 아래쪽). */
  open(opts = {}) {
    // 범위가 설정되어 있으면 범위 밖 달에서 열리지 않도록 시작 달로 보정하고,
    // 이전에 골라둔 날짜가 범위 밖이거나 이미 페이지가 있는 날짜면 선택을 해제한다
    if (this.range) {
      const ym = this.year * 100 + this.month;
      const sYm = this.range.start.year * 100 + this.range.start.month;
      const eYm = this.range.end.year * 100 + this.range.end.month;
      if (ym < sYm || ym > eYm) {
        this.year = this.range.start.year;
        this.month = this.range.start.month;
        this.selected = null;
      }
      if (this.selected != null &&
          (!this._inRange(this.selected) || this.takenDates.has(`${this.year}-${this.month}-${this.selected}`))) {
        this.selected = null;
      }
    }
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
    if (opts.anchor) {
      // 앵커 모드: 시트를 절대배치로 앵커 좌표 바로 위에(뷰포트 안으로 클램프) 놓는다
      this._overlay.classList.add('dp-anchored');
      this._sheet.style.position = 'absolute';
      const sw = this._sheet.offsetWidth, sh = this._sheet.offsetHeight;
      let left = Math.min(Math.max(8, opts.anchor.x - sw / 2), window.innerWidth - sw - 8);
      let top = opts.anchor.y - sh - 10;
      if (top < 8) top = Math.min(window.innerHeight - sh - 8, opts.anchor.y + 10);
      this._sheet.style.left = left + 'px';
      this._sheet.style.top = Math.max(8, top) + 'px';
    } else {
      this._overlay.classList.remove('dp-anchored');
      this._sheet.style.position = '';
      this._sheet.style.left = '';
      this._sheet.style.top = '';
    }
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
