/* ==========================================================
  app.js
  - 건드리지 말아야 할 부분: 로딩/렌더/필터/라우팅 로직
  - 향이 건드릴 부분: 블로그 제목/소개글/포인트컬러는 CSS :root
========================================================== */

const $ = (sel) => document.querySelector(sel);

function fmtDate(iso){
  // iso: "2025-12-24"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ko-KR", { year:"numeric", month:"short", day:"numeric" });
}

async function loadPosts(){
  const res = await fetch("posts/posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("posts.json 로드 실패");
  const data = await res.json();
  // 최신순
  return data.sort((a,b) => (b.date > a.date ? 1 : -1));
}

function uniqueTags(posts){
  const set = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

/* ---------- index ---------- */

function renderPostCard(p){
  const chips = (p.tags || []).slice(0,3)
    .map(t => `<span class="chip">#${t}</span>`).join("");

  return `
    <a class="post-card" data-type="${p.type || "tech"}"
       href="post.html?slug=${encodeURIComponent(p.slug)}">
      <p class="kicker">${fmtDate(p.date)} · ${p.readingTime || "—"} min</p>
      <h2 class="post-title">${p.title}</h2>
      <p class="post-summary">${p.summary || ""}</p>
      <div class="meta-row">
        <div class="chips">${chips}</div>
        <span>Read →</span>
      </div>
    </a>
  `;
}


function mountIndex(posts){
  const postsEl = $("#posts");
  const emptyEl = $("#empty");
  const searchEl = $("#search");
  const tagEl = $("#tagFilter");
  const chipsEl = $("#tagChips");
  $("#year").textContent = new Date().getFullYear();

  const tags = uniqueTags(posts);
const pinned = posts.filter(p => p.pinned);
const normal = posts.filter(p => !p.pinned);

const pinnedEl = document.getElementById("pinnedPosts");
if (pinnedEl){
  pinnedEl.innerHTML = pinned.map(renderPostCard).join("");
}

  // tag filter options
  tags.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `#${t}`;
    tagEl.appendChild(opt);
  });

  // tags section chips
  chipsEl.innerHTML = tags.map(t => `<span class="chip">#${t}</span>`).join(" ");

  function apply(){
    const q = (searchEl.value || "").trim().toLowerCase();
    const tag = tagEl.value;

    const filtered = posts.filter(p => {
      const hay = `${p.title} ${p.summary || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      const matchQ = q ? hay.includes(q) : true;
      const matchTag = tag ? (p.tags || []).includes(tag) : true;
      return matchQ && matchTag;
    });

    postsEl.innerHTML = filtered.map(renderPostCard).join("");
    emptyEl.classList.toggle("hidden", filtered.length !== 0);
  }

  searchEl.addEventListener("input", apply);
  tagEl.addEventListener("change", apply);

  apply();
}

/* ---------- post ---------- */

async function mountPost(posts){
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  $("#year").textContent = new Date().getFullYear();

  if (!slug){
    $("#title").textContent = "글을 찾을 수 없음";
    $("#content").innerHTML = `<p>slug가 없네… 링크가 삐끗했다.</p>`;
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post){
    $("#title").textContent = "글을 찾을 수 없음";
    $("#content").innerHTML = `<p>posts.json에 이 slug가 없어요: <code>${slug}</code></p>`;
    return;
  }

  document.title = `${post.title} • 향의 기술블로그`;
  $("#meta").textContent = `${fmtDate(post.date)} · ${post.readingTime || "—"} min`;
  $("#title").textContent = post.title;
  $("#summary").textContent = post.summary || "";

  $("#chips").innerHTML = (post.tags || []).map(t => `<span class="chip">#${t}</span>`).join("");

  // content: posts/*.html 파일을 그대로 불러와 삽입
  const res = await fetch(`posts/${post.file}`, { cache: "no-store" });
  if (!res.ok){
    $("#content").innerHTML = `<p>본문 파일을 못 불러왔어: <code>${post.file}</code></p>`;
    return;
  }
  const html = await res.text();
  $("#content").innerHTML = html;
}

/* ---------- bootstrap ---------- */

(async function init(){
  try{
    const posts = await loadPosts();
    const isPostPage = location.pathname.endsWith("post.html");
    if (isPostPage) await mountPost(posts);
    else await mountIndex(posts);
  }catch(err){
    console.error(err);
    const container = document.querySelector(".container");
    if (container){
      container.insertAdjacentHTML("beforeend", `
        <section class="card">
          <h2 class="card__title">에러</h2>
          <p class="card__text">posts 데이터를 불러오다가 터졌음. 콘솔 확인 ㄱㄱ</p>
        </section>
      `);
    }
  }
})();

