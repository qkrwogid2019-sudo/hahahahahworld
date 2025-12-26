/* =========================
   helpers
========================= */
const $ = (s) => document.querySelector(s);

/* =========================
   fetch utils (상대경로만 사용)
========================= */
async function fetchJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("JSON load failed: " + path);
  return res.json();
}

async function fetchText(path){
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("HTML load failed: " + path);
  return res.text();
}

/* =========================
   INDEX
========================= */
async function mountIndex(){
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const postsContainer = $("#posts");
  if (!postsContainer) return;

  let posts = [];

  try {
    posts = await fetchJSON("posts/posts.json");
  } catch (e) {
    console.error(e);
    postsContainer.innerHTML = "<p>포스트를 불러올 수 없습니다.</p>";
    return;
  }

  function render(list){
    postsContainer.innerHTML = list.map(p => `
      <a class="post-link" href="post.html?slug=${p.slug}">
        <h2>${p.title}</h2>
        <p>${p.summary}</p>
        <div class="tags">
          ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
      </a>
    `).join("");
  }

  render(posts);

  /* ---- search ---- */
  const search = $("#search");
  if (search){
    search.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      render(
        posts.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        )
      );
    });
  }

  /* ---- tabs ---- */
  const tabPosts = $("#tab-posts");
  const tabApp = $("#tab-app");
  const apps = $("#apps");

  if (tabPosts && tabApp && apps){
    tabPosts.onclick = () => {
  apps.classList.add("hidden");
  postsContainer.classList.remove("hidden");
};

tabApp.onclick = () => {
  postsContainer.classList.add("hidden");
  apps.classList.remove("hidden");
};

  }
}

/* =========================
   POST
========================= */
async function mountPost(){
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const slug = new URLSearchParams(location.search).get("slug");
  const content = $("#content");

  if (!slug || !content){
    content.innerHTML = "<p>잘못된 접근</p>";
    return;
  }

  let posts = [];
  try {
    posts = await fetchJSON("posts/posts.json");
  } catch (e) {
    content.innerHTML = "<p>글 목록을 불러오지 못했습니다.</p>";
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post){
    content.innerHTML = "<p>글 없음</p>";
    return;
  }

  $("#title").textContent = post.title;

  try {
    content.innerHTML = await fetchText(`posts/${post.file}`);
  } catch (e) {
    content.innerHTML = "<p>본문을 불러오지 못했습니다.</p>";
  }

  if (window.hljs) hljs.highlightAll();
}

/* =========================
   BOOT
========================= */
if (location.pathname.endsWith("post.html")){
  mountPost();
} else {
  mountIndex();
}


