// --------------------------------------------------
// 特定のURLのタブが開かれたら即座に閉じる処理（セーフティネット用）
// --------------------------------------------------
const blockedUrls = [
  'https://menu.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu2.edu-netz.com/netz/netz1/closewindow2.html',
  'https://menu.edu-netz.com/netz/netz1/tehai/shido_furikae_input_save_utf8.aspx',
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
// 既存コード互換用リスナー（不要なTODOアクション処理は削除）
// --------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.openTabBack !== undefined) {
    chrome.tabs.create({ url: request.openTabBack, active: false })
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => sendResponse({ status: 'error', message: e.message }));
    return true;
  }
});