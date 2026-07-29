class OverlayMenu {
  constructor(options = {}) {
    this.items = options.items || [];
    this.title = options.title || null;
    this.preview = options.preview || null; // { render(el), onClick() }
    this._backdrop = null;
    this._menu = null;
    this._previewThumbEl = null;
  }

  _buildMenu() {
    const menu = document.createElement('div');
    menu.className = 'om-menu';

    const glass = document.createElement('div');
    glass.className = 'om-glass';
    menu.appendChild(glass);

    const inner = document.createElement('div');
    inner.className = 'om-inner';

    if (this.preview) {
      const previewWrap = document.createElement('div');
      previewWrap.className = 'om-preview' + (this.preview.changeLabel ? ' om-preview-has-change' : '');
      const thumb = document.createElement('div');
      thumb.className = 'om-preview-thumb';
      previewWrap.appendChild(thumb);
      if (this.preview.changeLabel) {
        // 미리보기 우측 "변경" pill 버튼 — 이 버튼으로만 onClick(속지 변경)을 연다
        const changeBtn = document.createElement('button');
        changeBtn.className = 'om-preview-change';
        changeBtn.type = 'button';
        changeBtn.textContent = this.preview.changeLabel;
        changeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.close();
          if (this.preview.onClick) this.preview.onClick();
        });
        previewWrap.appendChild(changeBtn);
      } else {
        previewWrap.addEventListener('click', () => {
          this.close();
          if (this.preview.onClick) this.preview.onClick();
        });
      }
      inner.appendChild(previewWrap);
      this._previewThumbEl = thumb;

      const divider = document.createElement('div');
      divider.className = 'om-divider';
      inner.appendChild(divider);
    }

    const titlebar = document.createElement('div');
    titlebar.className = 'om-titlebar';
    titlebar.textContent = this.title || '';
    titlebar.style.display = this.title ? '' : 'none';
    inner.appendChild(titlebar);

    this.items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'om-item';

      const iconWrap = document.createElement('div');
      iconWrap.className = 'om-icon';
      if (item.lucideIcon) {
        const i = document.createElement('i');
        i.setAttribute('data-lucide', item.lucideIcon);
        i.style.cssText = 'width:20px;height:20px;color:rgba(0,0,0,0.86);';
        iconWrap.appendChild(i);
      } else if (item.icon) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.alt = '';
        iconWrap.appendChild(img);
      }

      const label = document.createElement('span');
      label.className = 'om-label';
      label.textContent = item.label || '';

      row.appendChild(iconWrap);
      row.appendChild(label);

      // Always read from this.items[index] so updateItem takes effect without DOM rebuild
      row.addEventListener('click', () => {
        if (this.items[index].onClick) this.items[index].onClick();
        this.close();
      });

      inner.appendChild(row);
    });

    menu.appendChild(inner);
    return menu;
  }

  open(x, y, opts = {}) {
    if (!this._backdrop) {
      this._backdrop = document.createElement('div');
      this._backdrop.className = 'om-backdrop';
      this._backdrop.addEventListener('click', () => this.close());
      document.body.appendChild(this._backdrop);
    }

    if (!this._menu) {
      this._menu = this._buildMenu();
      document.body.appendChild(this._menu);
      if (window.lucide) lucide.createIcons({ nodes: [this._menu] });
    }

    if (this.preview && this.preview.render && this._previewThumbEl) {
      this.preview.render(this._previewThumbEl);
    }

    this._backdrop.classList.remove('om-hidden');
    this._menu.style.display = '';

    // Re-trigger animations on glass + inner (not menu — transform on menu breaks backdrop-filter)
    [this._menu.querySelector('.om-glass'), this._menu.querySelector('.om-inner')].forEach(el => {
      if (!el) return;
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = '';
    });

    // Position: centered on x, below y, keep within viewport
    const menuW = 212;
    const menuH = this._menu.offsetHeight || 108;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x - menuW / 2;
    let top = opts.above ? y - menuH - 8 : y;

    if (left + menuW > vw - 8) left = vw - menuW - 8;
    if (left < 8) left = 8;
    if (!opts.above && top + menuH > vh - 8) top = y - menuH - 8;
    if (top < 8) top = 8;

    this._menu.style.left = left + 'px';
    this._menu.style.top = top + 'px';
  }

  close() {
    if (this._backdrop) this._backdrop.classList.add('om-hidden');
    if (this._menu) this._menu.style.display = 'none';
  }

  setTitle(text) {
    this.title = text || null;
    if (this._menu) {
      const titlebar = this._menu.querySelector('.om-titlebar');
      if (titlebar) {
        titlebar.textContent = text || '';
        titlebar.style.display = text ? '' : 'none';
      }
    }
  }

  updateItem(index, updates) {
    if (!this.items[index]) return;
    Object.assign(this.items[index], updates);
    if (this._menu && updates.label !== undefined) {
      const labels = this._menu.querySelectorAll('.om-label');
      if (labels[index]) labels[index].textContent = updates.label;
    }
  }

  mount(container) {
    const menu = this._buildMenu();
    menu.style.position = 'relative';
    menu.style.left = '';
    menu.style.top = '';
    container.appendChild(menu);
    if (window.lucide) lucide.createIcons({ nodes: [menu] });
  }
}
