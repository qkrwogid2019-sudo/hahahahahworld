console.log("🔥 app.js 로드됨");

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
  if (!postsEl) return; // index가 아니면 종료

  let posts;
  try {
    posts = await fetchJSON("posts/posts.json");
  } catch {
    postsEl.innerHTML = "<p>포스트를 불러오지 못했어</p>";
    return;
  }

  renderPosts(postsEl, posts);
  bindSearch(postsEl, posts);
}

function renderPosts(container, posts){
  container.innerHTML = posts.map(p => `
    <a class="post-link" href="post.html?slug=${p.slug}">
      ${p.date ? `<div class="post-meta">${p.date}</div>` : ""}
      <h2>${p.title}</h2>
      <p>${p.summary}</p>
      <div class="tags">
        ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    </a>
  `).join("");
}

function bindSearch(container, posts){
  const search = $("#search");
  if (!search) return;

  search.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderPosts(
      container,
      posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      )
    );
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
  try {
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

  try {
    contentEl.innerHTML = await fetchText(`posts/${post.file}`);
  } catch {
    contentEl.innerHTML = "<p>본문을 불러오지 못했어</p>";
  }

  renderSideList(posts, post);
  renderPostNav(posts, post);
}

/* 좌측 글 목록 */
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

/* 이전 / 다음 */
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
console.log("🔥 mountIndex 실행");

/* =========================
   BOOT (중요)
========================= */
if (location.pathname.endsWith("post.html")){
  mountPost();
} else {
  mountIndex();
}




