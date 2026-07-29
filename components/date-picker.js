class DatePicker {
  constructor(options = {}) {
    const today = new Date();
    this.year = options.year || today.getFullYear();
    this.month = options.month || today.getMonth() + 1;
    this.selected = options.selected || null;
    this.onConfirm = options.onConfirm || null;
    this.instantSelect = !!options.instantSelect; // true면 확인 버튼 없이 날짜를 누르는 즉시 확정된다
    this.multiSelect = !!options.multiSelect; // true면 여러 날짜를 하나씩 눌러 토글 선택하고 확인 시 한번에 확정
    this.selectedDates = new Set(); // 다중 선택 모드에서 선택된 날짜 키("YYYY-M-D")
    this._overlay = null;
    this._sheet = null;
    this.takenDates = new Set(
      (options.takenDates || []).map(d => `${d.year}-${d.month}-${d.day}`)
    );
    // 날짜별 공부시간 맵 ("YYYY-M-D" → "H:MM:SS"). 공부한 날짜는 셀 아래에 시간 단위로 작게 표시된다.
    this.studyDates = options.studyDates || {};
  }

  // "4:18:05" → "4h" (캘린더 셀 아래에 표시할 짧은 형태)
  _studyLabel(timeStr) {
    if (!timeStr) return '';
    const h = parseInt(String(timeStr).split(':')[0], 10);
    return isNaN(h) ? '' : `${h}h`;
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
          ${this.instantSelect
            ? '<div class="dp-header-spacer"></div>'
            : '<button class="dp-header-confirm-btn" disabled><i data-lucide="check" style="width:16px;height:16px;color:#fff;"></i></button>'}
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
    const confirmBtnEl = sheet.querySelector('.dp-header-confirm-btn');
    if (confirmBtnEl) {
      confirmBtnEl.addEventListener('click', () => {
        if (this.multiSelect) {
          if (this.selectedDates.size === 0) return;
          const dates = Array.from(this.selectedDates)
            .map(k => { const [y, m, d] = k.split('-').map(Number); return { year: y, month: m, day: d }; })
            .sort((a, b) => new Date(a.year, a.month - 1, a.day) - new Date(b.year, b.month - 1, b.day));
          if (this.onConfirm) this.onConfirm(dates);
          this.close();
          return;
        }
        if (this.selected == null) return;
        if (this.onConfirm) this.onConfirm({ year: this.year, month: this.month, day: this.selected });
        this.close();
      });
    }
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
        const dateKey = `${this.year}-${this.month}-${day}`;
        const taken = valid && this.takenDates.has(dateKey);
        const study = valid ? this._studyLabel(this.studyDates[dateKey]) : '';
        const cell = document.createElement('div');
        cell.className = 'dp-day-cell' + (valid ? '' : ' empty') + (taken ? ' taken' : '') + (study ? ' has-study' : '');
        const isSel = this.multiSelect
          ? (valid && !taken && this.selectedDates.has(dateKey))
          : (day === this.selected && !taken);
        const circleCls = `dp-day-circle${isSel ? ' selected' : ''}${taken ? ' taken' : ''}`;
        // 공부시간 마크는 항상 자리를 차지하게 두어(빈 셀은 공백) 날짜 동그라미의 세로 위치가 일정하다
        cell.innerHTML =
          `<div class="${circleCls}"><span class="dp-day-num">${valid ? day : ''}</span></div>` +
          `<span class="dp-study-mark">${study}</span>`;
        if (valid && !taken) {
          cell.addEventListener('click', () => {
            if (this.multiSelect) {
              // 하나씩 눌러 토글 — 확인을 눌러야 모두 확정
              if (this.selectedDates.has(dateKey)) this.selectedDates.delete(dateKey);
              else this.selectedDates.add(dateKey);
              this._renderGrid(sheet);
              return;
            }
            this.selected = day;
            if (this.instantSelect) {
              // 확인 버튼 없이 날짜를 누르는 즉시 확정 — 캘린더 노트처럼 바로 이동하는 용도
              if (this.onConfirm) this.onConfirm({ year: this.year, month: this.month, day });
            } else {
              this._renderGrid(sheet); // 선택 표시만 갱신 — 확인 버튼을 눌러야 실제로 확정된다
            }
          });
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    const confirmBtn = sheet.querySelector('.dp-header-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = this.multiSelect ? this.selectedDates.size === 0 : this.selected == null;
    // 다중 선택 모드에서는 선택 개수를 타이틀에 보여준다
    if (this.multiSelect) {
      const titleEl = sheet.querySelector('.dp-title');
      if (titleEl) titleEl.textContent = this.selectedDates.size ? `${this.selectedDates.size}개 선택` : '날짜 선택';
    }
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
    // 열 때마다 이전 선택은 초기화
    this.selected = null;
    this.selectedDates.clear();
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
