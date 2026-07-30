/* Note cover — components/note-cover.css의 마크업을 만들어 주는 헬퍼.
   표지는 "이미지 영역 + 띠" 두 값만 바꿔서 얼마든지 다른 표지를 만들 수 있게 되어 있다.

   NoteCover.html({ width, image, band, deco, className })  → HTML 문자열
   NoteCover.el(opts)                                       → DOM 엘리먼트
   NoteCover.vars({ width, image, band })                   → CSS 변수 문자열만 (기존 노드에 덮어쓸 때)
   NoteCover.darken(hex, f)                                 → 표지 색에서 띠 색을 자동 계산

   image 는 색(#f34c18 / red / rgb(...)), 그라디언트, 이미지 경로(assets/cover.png),
   data: URI, url(...) 무엇이든 받는다 — 경로처럼 보이면 url()로 감싸준다.
   band 를 생략하면 image가 단색일 때만 그 색을 어둡게 해서 자동으로 채운다. */
(function () {
  const RATIO = 480 / 360; // 원본 표지 비율 (Figma 4086:106790)

  const CSS_VALUE_RE = /^(url\(|-?(webkit-)?(linear|radial|conic|repeating-linear|repeating-radial|repeating-conic)-gradient\(|#|rgba?\(|hsla?\(|var\(|color-mix\()/i;
  const PATH_RE = /^(https?:|data:|\/|\.{0,2}\/)|\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i;
  const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  function normalizeImage(image) {
    if (image === undefined || image === null || image === '') return null;
    const v = String(image).trim();
    if (CSS_VALUE_RE.test(v)) return v;             // 이미 CSS background 값 (색·그라디언트·url·패턴)
    // 이미지 경로 → 표지를 꽉 채우는 background 단축값으로 만든다
    if (PATH_RE.test(v)) return `url("${v}") center center / cover no-repeat`;
    return v;                                      // 'red' 같은 색 키워드
  }

  // #rgb / #rrggbb 를 f배(0~1)만큼 어둡게 — 표지 색에서 띠 색을 뽑을 때 쓴다
  function darken(hex, f) {
    if (!HEX_RE.test(String(hex).trim())) return null;
    let h = String(hex).trim().slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    const g = (x) => Math.round(x * f);
    return `rgb(${g(n >> 16)},${g((n >> 8) & 255)},${g(n & 255)})`;
  }

  function vars(opts) {
    const o = opts || {};
    const out = [];
    if (o.width) out.push(`--ncv-w:${typeof o.width === 'number' ? o.width + 'px' : o.width}`);
    const image = normalizeImage(o.image);
    if (image) out.push(`--ncv-image:${image}`);
    // 띠 색: 명시값 우선, 없으면 단색 표지에서 자동 계산 (그라디언트·이미지면 CSS 기본값 유지)
    const band = o.band || darken(o.image, 0.32);
    if (band) out.push(`--ncv-band:${band}`);
    return out.join(';') + (out.length ? ';' : '');
  }

  function html(opts) {
    const o = opts || {};
    const cls = ['ncv'].concat(o.className ? [o.className] : []).join(' ');
    return `<div class="${cls}" style="${vars(o)}">
      <div class="ncv-image"></div>
      <div class="ncv-crease-a"></div>
      <div class="ncv-crease-b"></div>
      <div class="ncv-band"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ncv-inset"></div>
      ${o.deco ? `<div class="ncv-deco">${o.deco}</div>` : ''}
    </div>`;
  }

  function el(opts) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html(opts).trim();
    return wrap.firstElementChild;
  }

  window.NoteCover = { html, el, vars, darken, normalizeImage, ratio: RATIO };
})();
