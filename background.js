// --------------------------------------------------
// 特定のURLのタブが開かれたら即座に閉じる処理（セーフティネット用）
// --------------------------------------------------
const blockedUrls = [
  'https://menu.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu2.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu.edu-netz.com/netz/netz1/tehai/shido_furikae_input_save_utf8.aspx',
  'https://menu2.edu-netz.com/netz/netz1/tehai/shido_furikae_input_save_utf8.aspx',
  'https://menu.edu-netz.com/netz/netz1/tehai/tehai_input_save.aspx',
  'https://menu2.edu-netz.com/netz/netz1/tehai/tehai_input_save.aspx',
  'closewindow', 
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    for (const url of blockedUrls) {
      if (tab.url.startsWith(url) || tab.url.includes(url)) {
        chrome.tabs
          .remove(tabId)
          .catch((err) => console.error('Tab remove error:', err));
        break;
      }
    }
  }
});

// --------------------------------------------------
// メッセージ受信リスナー（裏タブ展開 ＆ 送信元タブの自動クローズを統合）
// --------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ① 裏（非アクティブ）で新しいタブを開く処理
  if (request.openTabBack !== undefined) {
    chrome.tabs.create({ url: request.openTabBack, active: false })
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => sendResponse({ status: 'error', message: e.message }));
    return true;
  }

  // ② 【合流ロジック】完了画面から送られてきた要求を受け取り、送信元のタブを確実に閉じる処理
  if (request.closeActiveTab === true) {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id)
        .then(() => sendResponse({ status: 'closed' }))
        .catch(e => console.error('Tab remove request error:', e));
    }
    return true;
  }
});