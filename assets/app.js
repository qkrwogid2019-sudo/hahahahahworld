/* =========================
   Helpers
========================= */
const $ = (s) => document.querySelector(s);

/* =========================
   Fetch Utils (relative path only)
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
  setYear();

  const postsEl = $("#posts");
  if (!postsEl) return;

  const posts = await loadPosts(postsEl);
  if (!posts) return;

  renderPosts(postsEl, posts);
  bindSearch(postsEl, posts);
  bindTabs(postsEl);
}

/* ---- helpers (index) ---- */

function setYear(){
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

async function loadPosts(container){
  try {
    return await fetchJSON("posts/posts.json");
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>미안해.다음기회에 또 봐</p>";
    return null;
  }
}

function renderPosts(container, list){
  container.innerHTML = list.map(p => `
    <a class="post-link" href="post.html?slug=${p.slug}">
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

function bindTabs(postsEl){
  const tabPosts = $("#tab-posts");
  const tabApp   = $("#tab-app");
  const appsEl   = $("#apps");

  if (!tabPosts || !tabApp || !appsEl) return;

  tabPosts.onclick = () => {
    appsEl.classList.add("hidden");
    postsEl.classList.remove("hidden");
    tabPosts.classList.add("active");
    tabApp.classList.remove("active");
  };

  tabApp.onclick = () => {
    postsEl.classList.add("hidden");
    appsEl.classList.remove("hidden");
    tabApp.classList.add("active");
    tabPosts.classList.remove("active");
  };
}

/* =========================
   POST
========================= */
async function mountPost(){
  setYear();

  const slug = new URLSearchParams(location.search).get("slug");
  const titleEl = $("#title");
  const contentEl = $("#content");

  if (!slug || !titleEl || !contentEl){
    if (contentEl) contentEl.innerHTML = "<p>잘못찾아왔어</p>";
    return;
  }

  let posts;
  try {
    posts = await fetchJSON("posts/posts.json");
  } catch {
    contentEl.innerHTML = "<p>앗.오류야</p>";
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post){
    contentEl.innerHTML = "<p>텅 비었어</p>";
    return;
  }

  titleEl.textContent = post.title;

  try {
    contentEl.innerHTML = await fetchText(`posts/${post.file}`);
  } catch {
    contentEl.innerHTML = "<p>앗 오류야</p>";
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



