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
    // 선택 단위 — 'day'(기본, 하루) | 'week'(캘린더 UI 유지, 한 줄=한 주 통째 선택) | 'month'(월 그리드)
    this.selectMode = options.selectMode || 'day';
    this.selectedWeekStart = null; // week 모드에서 고른 주의 월요일(Date)
    this.selectedMonth = null;     // month 모드에서 고른 달(1~12)
    this.takenWeeks = new Set(options.takenWeeks || []);   // 이미 페이지가 있는 주 ("YYYY-M-D" = 월요일)
    this.takenMonths = new Set(options.takenMonths || []); // 이미 페이지가 있는 달 ("YYYY-M")
    this.landOnCurrentMonth = !!options.landOnCurrentMonth; // true면 열 때마다 이번달로 이동
    this._overlay = null;
    this._sheet = null;
    this.takenDates = new Set(
      (options.takenDates || []).map(d => `${d.year}-${d.month}-${d.day}`)
    );
    // 날짜별 공부시간 맵 ("YYYY-M-D" → "H:MM:SS"). 공부한 날짜는 셀 아래에 시간 단위로 작게 표시된다.
    this.studyDates = options.studyDates || {};
  }

  _titleText() {
    if (this.selectMode === 'week') return '주 선택';
    if (this.selectMode === 'month') return '월 선택';
    return '날짜 선택';
  }

  // 어떤 날짜가 속한 주의 월요일
  _weekStartOf(date) {
    const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  _weekKeyOf(date) {
    const s = this._weekStartOf(date);
    return `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`;
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
          <span class="dp-title">${this._titleText()}</span>
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
          ${this.selectMode === 'month'
            ? '<div class="dp-months"></div>'
            : `<div class="dp-grid">
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
          </div>`}
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
        // 주 선택: 고른 주의 월요일을 돌려준다
        if (this.selectMode === 'week') {
          if (!this.selectedWeekStart) return;
          const s = this.selectedWeekStart;
          if (this.onConfirm) this.onConfirm({ year: s.getFullYear(), month: s.getMonth() + 1, day: s.getDate() });
          this.close();
          return;
        }
        // 월 선택: 연·월만 돌려준다(day 없음)
        if (this.selectMode === 'month') {
          if (this.selectedMonth == null) return;
          if (this.onConfirm) this.onConfirm({ year: this.year, month: this.selectedMonth });
          this.close();
          return;
        }
        if (this.selected == null) return;
        if (this.onConfirm) this.onConfirm({ year: this.year, month: this.month, day: this.selected });
        this.close();
      });
    }
    // 월 선택 모드에서는 좌우 화살표가 달이 아니라 연도를 옮긴다
    const step = (dir) => {
      if (this.selectMode === 'month') {
        this.year += dir;
      } else {
        this.month += dir;
        if (this.month < 1) { this.month = 12; this.year--; }
        if (this.month > 12) { this.month = 1; this.year++; }
      }
      this.selected = null;
      this.selectedWeekStart = null;
      this.selectedMonth = null;
      this._renderGrid(sheet);
    };
    sheet.querySelector('.dp-prev').addEventListener('click', () => step(-1));
    sheet.querySelector('.dp-next').addEventListener('click', () => step(1));
    this._renderGrid(sheet);

    return sheet;
  }

  // 월 선택 모드 — 1~12월 셀 그리드 (연도는 상단 화살표로 이동)
  _renderMonthGrid(sheet) {
    sheet.querySelector('.dp-month-title').textContent = `${this.year}년`;
    const wrap = sheet.querySelector('.dp-months');
    wrap.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const taken = this.takenMonths.has(`${this.year}-${m}`);
      const cell = document.createElement('div');
      cell.className = 'dp-month-cell' + (taken ? ' taken' : '') + (this.selectedMonth === m ? ' selected' : '');
      cell.textContent = `${m}월`;
      if (!taken) {
        cell.addEventListener('click', () => {
          this.selectedMonth = m;
          if (this.instantSelect) {
            if (this.onConfirm) this.onConfirm({ year: this.year, month: m });
          } else {
            this._renderMonthGrid(sheet);
          }
        });
      }
      wrap.appendChild(cell);
    }
    const confirmBtn = sheet.querySelector('.dp-header-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = this.selectedMonth == null;
  }

  _renderGrid(sheet) {
    if (this.selectMode === 'month') return this._renderMonthGrid(sheet);
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

      // 주 선택 모드: 캘린더 UI는 그대로 두되, 한 줄(월~일) 전체가 하나의 선택 단위가 된다.
      // 클릭 핸들러도 셀이 아니라 행에 달아 어느 칸을 눌러도 그 주가 통째로 눌린다.
      let rowStart = null;
      if (this.selectMode === 'week') {
        rowStart = new Date(this.year, this.month - 1, i - startOffset + 1); // 달을 넘어가도 JS가 보정
        const rowKey = `${rowStart.getFullYear()}-${rowStart.getMonth() + 1}-${rowStart.getDate()}`;
        const rowTaken = this.takenWeeks.has(rowKey);
        const rowSel = this.selectedWeekStart && this.selectedWeekStart.getTime() === rowStart.getTime();
        row.className += ' dp-week-pick' + (rowTaken ? ' taken' : '') + (rowSel ? ' selected' : '');
        if (!rowTaken) {
          row.addEventListener('click', () => {
            this.selectedWeekStart = rowStart;
            if (this.instantSelect) {
              if (this.onConfirm) this.onConfirm({ year: rowStart.getFullYear(), month: rowStart.getMonth() + 1, day: rowStart.getDate() });
            } else {
              this._renderGrid(sheet);
            }
          });
        }
      }

      for (let j = 0; j < 7; j++) {
        const day = (i + j) - startOffset + 1;
        const valid = day >= 1 && day <= daysInMonth;

        // 주 선택 모드에선 앞뒤 달로 넘어가는 칸도 실제 날짜를 흐리게 보여줘 한 주가 통째로 읽히게 한다
        if (this.selectMode === 'week' && !valid) {
          const dt = new Date(this.year, this.month - 1, day);
          const outCell = document.createElement('div');
          outCell.className = 'dp-day-cell dp-day-out';
          outCell.innerHTML = `<div class="dp-day-circle"><span class="dp-day-num">${dt.getDate()}</span></div>`;
          row.appendChild(outCell);
          continue;
        }

        const dateKey = `${this.year}-${this.month}-${day}`;
        const taken = valid && this.selectMode !== 'week' && this.takenDates.has(dateKey);
        const study = valid ? this._studyLabel(this.studyDates[dateKey]) : '';
        const cell = document.createElement('div');
        cell.className = 'dp-day-cell' + (valid ? '' : ' empty') + (taken ? ' taken' : '') + (study ? ' has-study' : '');
        const isSel = this.multiSelect
          ? (valid && !taken && this.selectedDates.has(dateKey))
          : (day === this.selected && !taken);
        const circleCls = `dp-day-circle${isSel ? ' selected' : ''}${taken ? ' taken' : ''}`;
        // 공부시간 마크는 항상 자리를 차지하게 두어(빈 셀은 공백) 날짜 동그라미의 세로 위치가 일정하다.
        // 단 주 선택 모드에선 아예 그리지 않는다 — 빈 자리가 남아 선택된 주 알약 안에서
        // 날짜가 위로 치우쳐 보인다.
        cell.innerHTML =
          `<div class="${circleCls}"><span class="dp-day-num">${valid ? day : ''}</span></div>` +
          (this.selectMode === 'week' ? '' : `<span class="dp-study-mark">${study}</span>`);
        // 주 선택 모드에선 칸별 클릭을 달지 않는다 — 선택은 행(주) 단위로만 일어난다
        if (valid && !taken && this.selectMode !== 'week') {
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
    if (confirmBtn) {
      confirmBtn.disabled = this.multiSelect ? this.selectedDates.size === 0
        : this.selectMode === 'week' ? this.selectedWeekStart == null
        : this.selected == null;
    }
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
    this.selectedWeekStart = null;
    this.selectedMonth = null;
    // 직접 선택 등: 열 때마다 이번달로 이동
    if (this.landOnCurrentMonth) {
      const t = new Date();
      this.year = t.getFullYear();
      this.month = t.getMonth() + 1;
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
