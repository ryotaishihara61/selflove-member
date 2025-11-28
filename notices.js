(function () {
  const listEl = document.getElementById("notices-list");
  const statusEl = document.getElementById("notices-status");

  function renderMessage(msg) {
    if (statusEl) {
      statusEl.innerHTML = msg;
    } else if (listEl) {
      listEl.innerHTML = `<p>${msg}</p>`;
    }
  }

  function renderNotices(notices) {
    if (!notices || notices.length === 0) {
      renderMessage("現在お知らせはありません。");
      return;
    }

    const html = notices
      .sort((a, b) => {
        // 公開日の新しい順（published_at列がある前提。なければ title などでソートor削除）
        if (!a.published_at || !b.published_at) return 0;
        return new Date(b.published_at) - new Date(a.published_at);
      })
      .map((n) => {
        const date = n.published_at
          ? new Date(n.published_at).toLocaleDateString("ja-JP")
          : "";
        const body = (n.body || "").replace(/\n/g, "<br>");

        return `
          <article class="notice-item">
            <h2 class="notice-title">${n.title || ""}</h2>
            <div class="notice-meta">${date}</div>
            <div class="notice-body">${body}</div>
          </article>
        `;
      })
      .join("");

    listEl.innerHTML = html;
    if (statusEl) statusEl.innerHTML = "";
  }

  // ▼ JSONP のコールバックを global に生やす
  window.handleNoticesResponse = function (data) {
    const notices = (data && data.notices) || [];
    renderNotices(notices);
  };

  // ▼ GAS を <script> として読み込む（CORS回避）
  // API_BASE は index.html と同じように <script> で定義されている前提
  const script = document.createElement("script");
  script.src = `${API_BASE}?type=notices&callback=handleNoticesResponse&ts=${Date.now()}`;
  script.onerror = function () {
    renderMessage("お知らせの取得に失敗しました。時間をおいて再度お試しください。");
  };

  document.body.appendChild(script);
})();
