console.log("🔥 app.js 로드됨");

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
  bindBackToCards();
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
  const controls = $("#postsControls");
  const pagination = $("#pagination");

  controls.classList.add("hidden");

  const start = (page - 1) * PAGE_SIZE;
  const slice = allPostsCache.slice(start, start + PAGE_SIZE);

  renderPosts(postsEl, slice, false);
  renderPagination(allPostsCache.length, page);

  pagination.classList.toggle(
    "hidden",
    allPostsCache.length <= PAGE_SIZE
  );
}

/* =========================
   ARCHIVE MODE (텍스트 리스트)
========================= */
function renderArchive(){
  currentMode = "list";
  currentPage = 1;

  const postsEl = $("#posts");
  const controls = $("#postsControls");
  const pagination = $("#pagination");

  // 🔥 이 줄이 핵심
  controls.classList.remove("hidden");

  pagination.classList.add("hidden");

  renderPosts(postsEl, allPostsCache, true);
  postsEl.scrollIntoView({ behavior: "smooth" });
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
    renderArchive();
  });
}

function bindBackToCards(){
  const btn = $("#backToCards");
  if (!btn) return;

  btn.addEventListener("click", () => {
    renderCardPage(1);
  });
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
    renderPosts(postsEl, filtered, false);

    $("#pagination")?.classList.add("hidden");
    $("#postsControls")?.classList.add("hidden");
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
   Post Side List
========================= */
function renderSideList(posts, current){
  const listEl = document.querySelector(".post-list");
  if (!listEl) return;

  listEl.innerHTML = posts.map(p => `
    <a href="post.html?slug=${p.slug}"
       class="${p.slug === current.slug ? "active" : ""}">
      ${p.title}
    </a>
  `).join("");
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
    prevEl.classList.remove("hidden");
  }

  if (next){
    nextEl.href = `post.html?slug=${next.slug}`;
    nextEl.textContent = `${next.title} →`;
    nextEl.classList.remove("hidden");
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
    introPanel.classList.toggle("hidden");
  });
}

/* =========================
   BOOT
========================= */
if (location.pathname.endsWith("post.html")){
  mountPost();
} else {
  mountIndex();
}




