// --------------------------------------------------
// 特定のURLのタブが開かれたら即座に閉じる処理
// --------------------------------------------------
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

// --------------------------------------------------
// 【統合版窓口】すべてのメッセージを受け取るリスナー
// --------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // 1. 既存コード互換用
  if (request.openTabBack !== undefined) {
    chrome.tabs.create({ url: request.openTabBack, active: false })
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => sendResponse({ status: 'error', message: e.message }));
    return true;
  }

  // 2. オリジナルメニューからの指示（TODO自動操作）
  if (request.type === "EXECUTE_TODO_ACTION") {
    const taskIds = request.taskIds;
    const action = request.action; // delete_tanto, change_status, change_progress
    const currentOrigin = new URL(sender.tab.url).origin;

    taskIds.forEach(taskId => {
      // リンク２（todo_input.aspx）へ「どのタスクか(id)」と「どの処理か(mode)」を伝えて裏で開く
      const url = `${currentOrigin}/netz/netz1/todo/todo_input.aspx?id=${taskId}&mode=${action}`;
      
      chrome.tabs.create({ url: url, active: false })
        .then((newTab) => {
          console.log(`裏画面で編集ページを開きました: ID ${newTab.id} -> ${url}`);
        })
        .catch((err) => console.error('タブ作成エラー:', err));
    });
    
    sendResponse({ status: "processing", count: taskIds.length });
    return true;
  }
});