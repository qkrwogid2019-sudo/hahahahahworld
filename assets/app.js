const $ = (s) => document.querySelector(s);


async function fetchJSON(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("JSON load fail");
  return r.json();
}

async function fetchText(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("HTML load fail");
  return r.text();
}

async function mountIndex(){
  $("#year").textContent = new Date().getFullYear();

  const posts = await fetchJSON(`${BASE}/posts/posts.json`);
  const container = $("#posts");

  container.innerHTML = posts.map(p => `
    <a class="post-link" href="post.html?slug=${p.slug}">
      <h2>${p.title}</h2>
      <p>${p.summary}</p>
      <div class="tags">
        ${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join("")}
      </div>
    </a>
  `).join("");
}

async function mountPost(){
  $("#year").textContent = new Date().getFullYear();

  const slug = new URLSearchParams(location.search).get("slug");
  const posts = await fetchJSON("/posts/posts.json");
  const post = posts.find(p => p.slug === slug);

  $("#title").textContent = post.title;
  $("#content").innerHTML = await fetchText(`/posts/${post.file}`);

  if (window.hljs) hljs.highlightAll();
}


if (location.pathname.endsWith("post.html")){
  mountPost();
} else {
  mountIndex();
}

