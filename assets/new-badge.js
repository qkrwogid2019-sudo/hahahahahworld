// NEW 배지 자동 표시 (최근 5일 이내 업데이트)
(function() {
  const NEW_DAYS = 5;

  // 탭 이름 → href 매핑
  const tabMap = {
    posts: 'index.html',
    apps: 'app.html',
    works: 'works.html'
  };

  // 날짜 차이 계산 (일 단위)
  function daysDiff(dateStr) {
    const updated = new Date(dateStr);
    const now = new Date();
    const diff = now - updated;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // NEW 배지 추가
  function addBadge(tabLink) {
    if (tabLink.querySelector('.new-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'NEW';
    tabLink.appendChild(badge);
  }

  // 메인 로직
  fetch('assets/tab-updates.json')
    .then(res => res.json())
    .then(data => {
      document.querySelectorAll('.tab-link').forEach(tab => {
        const href = tab.getAttribute('href');

        Object.entries(tabMap).forEach(([key, path]) => {
          if (href === path || href.endsWith('/' + path)) {
            const lastUpdate = data[key];
            if (lastUpdate && daysDiff(lastUpdate) <= NEW_DAYS) {
              addBadge(tab);
            }
          }
        });
      });
    })
    .catch(err => console.log('tab-updates.json 로드 실패:', err));
})();
