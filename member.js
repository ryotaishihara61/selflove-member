(function () {
    const card = document.getElementById("card");
  
    // メッセージ表示用（エラー／案内など）
    function renderMessage(html) {
      card.innerHTML = `<div class="message">${html}</div>
        <div class="footer-link">
          <a href="https://selflove.or.jp/" target="_blank" rel="noreferrer">
            一般社団法人セルフラブ協会 公式サイトへ
          </a>
        </div>`;
    }
  
    // Googleドライブ共有URLを <img> で扱いやすい形式に変換
    function normalizePhotoUrl(raw) {
      if (!raw) return "";
  
      // Googleドライブの共有リンク形式
      // 例: https://drive.google.com/file/d/ID/view?usp=sharing
      if (raw.includes("drive.google.com/file/d/")) {
        const m = raw.match(/\/file\/d\/([^/]+)/);
        if (m && m[1]) {
          const url = `https://drive.google.com/uc?export=view&id=${m[1]}`;
          console.log("normalized photo url:", url);
          return url;
        }
      }
  
      // それ以外はそのまま返す（直接リンクや他のCDNなど）
      console.log("raw photo url used as-is:", raw);
      return raw;
    }
  
    // URLパラメータから token を取得
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
  
    if (!token) {
      renderMessage(
        "このページはセルフラブ協会の会員証表示用ページです。<br>事務局から共有された会員証URLでアクセスしてください。"
      );
      return;
    }
  
    // GASのWebアプリ(API_BASE)に問い合わせ
    // ※ API_BASE は index.html 側で <script> 内に定義済み
    console.log("API_BASE:", API_BASE);
    console.log("token:", token);
  
    fetch(`${API_BASE}?type=member&token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        const member = data.member;
        if (!member) {
          renderMessage("会員情報が見つかりませんでした。");
          return;
        }
  
        const displayName = member.display_name || "Member";
        const memberId = member.member_id || "-";
  
        // 入会日を整形（2025/12/1 など）
        let joined = "-";
        if (member.joined_date) {
          const d = new Date(member.joined_date);
          if (!isNaN(d.getTime())) {
            joined = d.toLocaleDateString("ja-JP");
          }
        }
  
        // 写真URLを正規化（Googleドライブ共有URL対応）
        const photoUrl = normalizePhotoUrl(member.photo_url);
        const photo = photoUrl
          ? `<div class="photo"><img src="${photoUrl}" alt="${displayName}" /></div>`
          : `<div class="photo">No Photo</div>`;
  
        console.log("final photoUrl used:", photoUrl || "(none)");
  
        card.innerHTML = `
          <div class="card-logo">
            <img src="./logo.png" alt="セルフラブ協会ロゴ" />
          </div>
          <div class="card-header">
            <div class="label">一般社団法人</div>
            <div class="title">セルフラブ協会</div>
          </div>
          <div class="photo-wrap">
            ${photo}
          </div>
          <div class="info">
            <div class="name">${displayName}</div>
            <div>会員番号：${memberId}</div>
            <div>入会日：${joined}</div>
          </div>
          <div class="footer-link">
            <a href="https://selflove.or.jp/" target="_blank" rel="noreferrer">
              一般社団法人セルフラブ協会 公式サイト
            </a>
          </div>
        `;
      })
      .catch((err) => {
        console.error("fetch error:", err);
        renderMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      });
  })();
  