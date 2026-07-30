/* Store card — components/store-card.css의 마크업을 만들어 주는 헬퍼.

   StoreCard.html({ bg, badge, name, desc, attrs })  → HTML 문자열
   StoreCard.el(opts)                               → DOM 엘리먼트

   bg    : 썸네일 배경 (색·그라디언트 등 CSS background 값)
   badge : '무료' / '프리미엄' 같은 좌하단 배지. 없으면 배지를 그리지 않는다
   attrs : 루트에 붙일 data-* 등 { 'data-id': 'd1' } 형태

   썸네일 가운데 .stc-preview는 빈 슬롯으로 남는다 — 호출부가 삽입 후
   실제 속지 미리보기를 채워 넣는다(예: renderThumb(card, el.querySelector('.stc-preview'))). */
(function () {
  function attrString(attrs) {
    if (!attrs) return '';
    return Object.keys(attrs).map(k => ` ${k}="${String(attrs[k]).replace(/"/g, '&quot;')}"`).join('');
  }

  function html(opts) {
    const o = opts || {};
    const cls = ['stc'].concat(o.className ? [o.className] : []).join(' ');
    return `<div class="${cls}" style="${o.bg ? `--stc-bg:${o.bg};` : ''}"${attrString(o.attrs)}>
      <div class="stc-thumb">
        <div class="stc-preview"></div>
        <div class="stc-fade"></div>
        ${o.badge ? `<div class="stc-badge">${o.badge}</div>` : ''}
      </div>
      <div class="stc-meta">
        <div class="stc-name">${o.name || ''}</div>
        <div class="stc-desc">${o.desc || ''}</div>
      </div>
    </div>`;
  }

  function el(opts) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html(opts).trim();
    return wrap.firstElementChild;
  }

  window.StoreCard = { html, el };
})();
