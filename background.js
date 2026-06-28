// --------------------------------------------------
// 特定のURLのタブが開かれたら即座に閉じる処理
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
// 【復活】フロントからのメッセージを確実に受け取るリスナー
// --------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.openTabBack !== undefined) {
    chrome.tabs.create({ url: request.openTabBack, active: false })
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => sendResponse({ status: 'error', message: e.message }));
    return true;
  }

  // 自動操作用タブ生成メッセージのハンドリング
  if (request.type === "EXECUTE_TODO_ACTION") {
    const taskIds = request.taskIds;
    const action = request.action; 
    const extraParam = request.extraParam || ""; 
    const currentOrigin = new URL(sender.tab.url).origin;

    console.log(`[Background受信] アクション: ${action}, タスク数: ${taskIds.length}`);

    taskIds.forEach(taskId => {
      const url = `${currentOrigin}/netz/netz1/todo/todo_input.aspx?id=${taskId}&mode=${action}&param=${encodeURIComponent(extraParam)}`;
      
      chrome.tabs.create({ url: url, active: false })
        .then((newTab) => {
          console.log(`裏画面タブを生成しました: ID ${newTab.id} -> ${url}`);
        })
        .catch((err) => console.error('タブ作成エラー:', err));
    });
    
    sendResponse({ status: "ok", message: "Processing started" });
    return true; // 非同期応答の維持
  }
});