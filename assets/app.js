/* =========================
   CONFIG / STATE
========================= */
const PAGE_SIZE = 4;
let currentPage = 1;
let currentMode = "card"; // "card" | "list"
let allPostsCache = [];

/* =========================
   Helpers
========================= */
const $ = (s) => document.querySelector(s);

/* =========================
   Fetch
========================= */
async function fetchJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(path);
  return res.json();
}

async function fetchText(path){
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(path);
  return res.text();
}

/* =========================
   Shared
========================= */
function setYear(){
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

/* =========================
   INDEX PAGE
========================= */
async function mountIndex(){
  setYear();

  const postsEl = $("#posts");
  if (!postsEl) return;

  try{
    allPostsCache = await fetchJSON("posts/posts.json");
  } catch {
    postsEl.innerHTML = "<p>포스트를 불러오지 못했어</p>";
    return;
  }

  renderCardPage(1);
  bindSearch();
  bindArchiveToggle();
  bindPaginationArrows();
}

/* =========================
   Render (공통)
========================= */
function renderPosts(container, posts, listMode){
  container.classList.toggle("list-mode", listMode);

  container.innerHTML = posts.map(p => `
    <a class="post-link" href="post.html?slug=${p.slug}">
      ${p.date ? `<div class="post-meta">${p.date}</div>` : ""}
      <h2 class="post-title">${p.title}</h2>
      ${!listMode && p.summary ? `<p>${p.summary}</p>` : ""}
      ${!listMode ? `
        <div class="tags">
          ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
      ` : ""}
    </a>
  `).join("");
}

/* =========================
   CARD MODE (페이지네이션)
========================= */
function renderCardPage(page){
  currentMode = "card";
  currentPage = page;

  const postsEl = $("#posts");
  const paginationWrapper = $("#paginationWrapper");

  const totalPages = Math.ceil(allPostsCache.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const slice = allPostsCache.slice(start, start + PAGE_SIZE);

  renderPosts(postsEl, slice, false);
  renderPagination(allPostsCache.length, page);

  // 화살표 버튼 상태 업데이트
  const prevBtn = $("#prevPage");
  const nextBtn = $("#nextPage");
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;

  // 페이지네이션 wrapper 표시/숨김
  if (paginationWrapper) {
    paginationWrapper.classList.toggle("hidden", allPostsCache.length <= PAGE_SIZE);
  }
}
/* =========================
   ARCHIVE LIST (카테고리별 아코디언)
========================= */
const CATEGORY_ORDER = ["수업", "인사이트", "공부", "자동화", "블로그 만들기"];

function toggleArchiveList(){
  const archiveList = $("#archiveList");
  const btn = $("#allPostsBtn");
  if (!archiveList) return;

  const isHidden = archiveList.classList.contains("hidden");

  if (isHidden) {
    // 카테고리별로 그룹핑
    const grouped = {};
    allPostsCache.forEach(p => {
      const cat = p.category || "기타";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    // 카테고리 순서대로 정렬
    const sortedCategories = CATEGORY_ORDER.filter(cat => grouped[cat]);
    // 순서에 없는 카테고리도 추가
    Object.keys(grouped).forEach(cat => {
      if (!sortedCategories.includes(cat)) sortedCategories.push(cat);
    });

    // 아코디언 HTML 생성
    archiveList.innerHTML = sortedCategories.map(cat => `
      <div class="archive-category">
        <button class="archive-category-btn" data-category="${cat}">
          <span>${cat}</span>
          <span class="archive-count">${grouped[cat].length}</span>
          <span class="archive-arrow">▼</span>
        </button>
        <div class="archive-category-list hidden">
          ${grouped[cat].map(p => `
            <a href="post.html?slug=${p.slug}">${p.title}</a>
          `).join("")}
        </div>
      </div>
    `).join("");

    // 아코디언 클릭 이벤트
    archiveList.querySelectorAll(".archive-category-btn").forEach(catBtn => {
      catBtn.addEventListener("click", () => {
        const list = catBtn.nextElementSibling;
        const arrow = catBtn.querySelector(".archive-arrow");
        list.classList.toggle("hidden");
        arrow.textContent = list.classList.contains("hidden") ? "▼" : "▲";
      });
    });

    archiveList.classList.remove("hidden");
    if (btn) btn.textContent = "접기 ↑";
  } else {
    archiveList.classList.add("hidden");
    if (btn) btn.textContent = "모든 포스트 보기 →";
  }
}


/* =========================
   Pagination UI
========================= */
function renderPagination(totalCount, current){
  const pagination = $("#pagination");
  if (!pagination) return;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1){
    pagination.innerHTML = "";
    return;
  }

  let html = `
    <button class="page-btn" data-page="1">«</button>
    <button class="page-btn" data-page="${Math.max(1, current - 1)}">‹</button>
  `;

  for (let i = 1; i <= totalPages; i++){
    html += `
      <button
        class="page-btn ${i === current ? "active" : ""}"
        data-page="${i}">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="page-btn" data-page="${Math.min(totalPages, current + 1)}">›</button>
    <button class="page-btn" data-page="${totalPages}">»</button>
  `;

  pagination.innerHTML = html;

  pagination.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.page);
      if (currentMode === "card"){
        renderCardPage(page);
      }
    });
  });
}

/* =========================
   Bindings
========================= */
function bindArchiveToggle(){
  const btn = $("#allPostsBtn");
  if (!btn) return;

  btn.addEventListener("click", e => {
    e.preventDefault();
    toggleArchiveList();
  });
}

function bindPaginationArrows(){
  const prevBtn = $("#prevPage");
  const nextBtn = $("#nextPage");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        renderCardPage(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(allPostsCache.length / PAGE_SIZE);
      if (currentPage < totalPages) {
        renderCardPage(currentPage + 1);
      }
    });
  }
}

function bindSearch(){
  const search = $("#search");
  if (!search) return;

  search.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();

    const filtered = allPostsCache.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.summary || "").toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );

    const postsEl = $("#posts");
    const paginationWrapper = $("#paginationWrapper");

    renderPosts(postsEl, filtered, false);

    paginationWrapper?.classList.add("hidden");
  });
}


/* =========================
   POST PAGE
========================= */
async function mountPost(){
  setYear();

  const slug = new URLSearchParams(location.search).get("slug");
  const titleEl = $("#title");
  const contentEl = $("#content");

  if (!slug || !titleEl || !contentEl) return;

  let posts;
  try{
    posts = await fetchJSON("posts/posts.json");
  } catch {
    contentEl.innerHTML = "<p>글 목록을 불러오지 못했어</p>";
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post){
    contentEl.innerHTML = "<p>글이 없어</p>";
    return;
  }

  titleEl.textContent = post.title;

  try{
    contentEl.innerHTML = await fetchText(`posts/${post.file}`);
  } catch {
    contentEl.innerHTML = "<p>본문을 불러오지 못했어</p>";
  }

  renderSideList(posts, post);
  renderPostNav(posts, post);
}

/* =========================
   Post Side List (카테고리별 아코디언)
========================= */
function renderSideList(posts, current){
  const listEl = document.querySelector(".post-list");
  if (!listEl) return;

  // 카테고리별로 그룹핑
  const grouped = {};
  posts.forEach(p => {
    const cat = p.category || "기타";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  // 카테고리 순서
  const order = ["수업", "인사이트", "공부", "자동화", "블로그 만들기"];
  const sortedCategories = order.filter(cat => grouped[cat]);
  Object.keys(grouped).forEach(cat => {
    if (!sortedCategories.includes(cat)) sortedCategories.push(cat);
  });

  // 현재 포스트의 카테고리 찾기
  const currentCategory = current.category || "기타";

  // 아코디언 HTML 생성
  listEl.innerHTML = sortedCategories.map(cat => {
    const isCurrentCat = cat === currentCategory;
    return `
      <div class="side-category">
        <button class="side-category-btn" data-category="${cat}">
          <span>${cat}</span>
          <span class="side-arrow">${isCurrentCat ? "▲" : "▼"}</span>
        </button>
        <div class="side-category-list ${isCurrentCat ? "" : "hidden"}">
          ${grouped[cat].map(p => `
            <a href="post.html?slug=${p.slug}" class="${p.slug === current.slug ? "active" : ""}">
              ${p.title}
            </a>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  // 아코디언 클릭 이벤트
  listEl.querySelectorAll(".side-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const list = btn.nextElementSibling;
      const arrow = btn.querySelector(".side-arrow");
      list.classList.toggle("hidden");
      arrow.textContent = list.classList.contains("hidden") ? "▼" : "▲";
    });
  });
}

/* =========================
   Prev / Next
========================= */
function renderPostNav(posts, current){
  const prevEl = $("#prev-post");
  const nextEl = $("#next-post");
  if (!prevEl || !nextEl) return;

  const index = posts.findIndex(p => p.slug === current.slug);

  const prev = posts[index - 1];
  const next = posts[index + 1];

  if (prev){
    prevEl.href = `post.html?slug=${prev.slug}`;
    prevEl.textContent = `← ${prev.title}`;
    prevEl.classList.remove("is-hidden");
  }

  if (next){
    nextEl.href = `post.html?slug=${next.slug}`;
    nextEl.textContent = `${next.title} →`;
    nextEl.classList.remove("is-hidden");
  }
}

/* =========================
   Scroll To Top
========================= */
const scrollTopBtn = $("#scrollTopBtn");
if (scrollTopBtn){
  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 300);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================
   Intro Toggle
========================= */
const introBtn = $("#introBtn");
const introPanel = $("#introPanel");

if (introBtn && introPanel){
  introBtn.addEventListener("click", () => {
    introPanel.classList.toggle("is-hidden");
  });
}

document.querySelectorAll(".tab-link").forEach(a => {
  if (a.href === location.href) {
    a.classList.add("active");
  } else {
    a.classList.remove("active");
  }
});

/* =========================
   우클릭 & 드래그 방지
========================= */
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('selectstart', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  e.preventDefault();
  return false;
});

// 개발자 도구 단축키 막기
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (개발자 도구)
  if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
    e.preventDefault();
    return false;
  }
  // Ctrl+U (소스 보기)
  if (e.ctrlKey && e.key.toUpperCase() === 'U') {
    e.preventDefault();
    return false;
  }
  // Cmd+Option+I (Mac 개발자 도구)
  if (e.metaKey && e.altKey && e.key.toUpperCase() === 'I') {
    e.preventDefault();
    return false;
  }
});

/* =========================
   모바일 롱프레스 방지 (이벤트 위임)
========================= */
document.addEventListener('touchstart', (e) => {
  // input, textarea는 허용
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // 이미지는 무조건 차단
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
}, { passive: false });

// 롱프레스 컨텍스트 메뉴 차단
document.addEventListener('touchstart', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.style.pointerEvents = 'none';
    setTimeout(() => {
      e.target.style.pointerEvents = '';
    }, 500);
  }
}, { passive: true });

// contextmenu 완전 차단 (이미지 포함 전체)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, true);

/* =========================
   BOOT
========================= */
if (location.pathname.endsWith("post.html")){
  mountPost();
} else {
  mountIndex();
}




