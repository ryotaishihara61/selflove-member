// URLパラメータからtokenを取得して戻るリンクに追加
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
if (token) {
  const backLink = document.getElementById("backLink");
  backLink.href = `./index.html?token=${encodeURIComponent(token)}`;
}

fetch(`${API_BASE}?type=notices`)
  .then(res => res.json())
  .then(data => {
    const list = data.notices || [];
    const el = document.getElementById("notices");

    if (list.length === 0) {
      el.innerHTML = "<div class='message'>現在お知らせはありません。</div>";
      return;
    }

    el.innerHTML = list.map(n => `
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;color:#9ca3af;">${n.published_at}</div>
        <div style="font-weight:600;">${n.title}</div>
        <div style="font-size:12px;">${n.body}</div>
      </div>
    `).join("");
  });
