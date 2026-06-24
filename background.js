// --------------------------------------------------
// 特定のURLのタブが開かれたら即座に閉じる処理
// closewindow系はセキュリティの問題で閉じれないので残るが拡張機能なら強制的に閉じられる
// --------------------------------------------------

// 強制的に閉じるURL
const blockedUrls = [
  'https://menu.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu2.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu.edu-netz.com/netz/netz1/tehai/shido_furikae_input_save_utf8.aspx',
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    for (const url of blockedUrls) {
      if (tab.url.startsWith(url)) {
        chrome.tabs
          .remove(tabId)
          .catch((err) => console.error('Tab remove error:', err));
        break;
      }
    }
  }
});

// ★ここを追加：ページ側からのメッセージを受け取るリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.openTabBack !== undefined) {
    chrome.tabs
      .create({ url: request.openTabBack, active: false })
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => {
        console.error(e.message);
        sendResponse({ status: 'error', message: e.message });
      });
    return true; // 非同期処理（sendResponse）のために必須
  }
});
