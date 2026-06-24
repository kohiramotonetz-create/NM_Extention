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
// --------------------------------------------------
// オリジナルメニューからの指示を受けて、人間と同じ操作をシミュレート
// --------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "EXECUTE_TODO_ACTION") {
    const taskIds = request.taskIds;
    const action = request.action;
    
    // 現在のタブのURLからドメインを取得
    const currentOrigin = new URL(sender.tab.url).origin;

    taskIds.forEach(taskId => {
      if (action === "change_status") {
        // 状態変更（完了）URL
        const url = `${currentOrigin}/netz/netz1/todo/todo_input.aspx?setState=F&doSave=true&id=${taskId}`;
        openTabAndOperate(url);
      } 
      else if (action === "change_progress") {
        // 進捗率変更（100%）URL
        const url = `${currentOrigin}/netz/netz1/todo/todo_input.aspx?setProgress=100&doSave=true&id=${taskId}`;
        openTabAndOperate(url);
      } 
      else if (action === "delete_tanto") {
        console.log(`バックグラウンド：タスク ${taskId} の担当者削除シミュレート（開発中）`);
      }
    });
    
    sendResponse({ status: "processing" });
    return true;
  }
});

// 裏タブ操作関数
function openTabAndOperate(targetUrl) {
  chrome.tabs.create({ url: targetUrl, active: false })
    .then((newTab) => {
      console.log(`裏画面シミュレート中: ID ${newTab.id}`);
    })
    .catch((err) => console.error('シミュレートエラー:', err));
}
