console.log('functions.js imported.');

// 1. すべての基盤となるグローバルオブジェクトの宣言
const FUNCTION = {};

// ==================================================
// ★ デザイン・スタイルの一括管理
// ==================================================
FUNCTION.styles = {
  // システム標準のボタンやセレクトボックスに100%同期するデザイン
  systemButton: {
    'padding': '0px 6px',
    'margin-left': '10px',
    'margin-top': '0px',
    'margin-bottom': '2px',
    'font-family': '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
    'font-size': '9pt',
    'font-weight': '500',
    'color': '#111111',
    'border': '1px solid #666666',
    'border-radius': '3px',
    'background': 'linear-gradient(to bottom, #ffffff 0%, #e1e1e1 100%)',
    'vertical-align': 'middle',
    'height': '22px',
    'box-shadow': '0 1px 1px rgba(0,0,0,0.1)',
    'cursor': 'pointer'
  }
};

// ==================================================
// 汎用コア機能（非同期通信など）
// ==================================================
FUNCTION.postData = async function (endpoint, body) {
  if (!endpoint) {
    console.log('missing target url');
    return null;
  }
  try {
    const response = await $.post(endpoint, body);
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    return data;
  } catch (error) {
    console.error('Fetch Error', error);
  }
};

// 雛形パーツ
FUNCTION.pagename = {
  appendButton: function () {
    const endpoint = '送信先URL';
    const body = {};
    $('button', {
      text: '送信ボタン',
      on: {
        click: FUNCTION.postData(endpoint, body),
      },
    }).appendTo('body');
  },
};

// ==================================================
// ページ固有のカスタムコンポーネント
// ==================================================

// --- yotei2（予定画面） ---
FUNCTION.yotei2_codelist = {
  // LocalStorageのキー名
  STORAGE_KEY: 'custom_special_codes',

  // デフォルトのコードセット
  defaultCodes: [
    { text: '専門部会', value: '000360,000161,000325,000015,000387,000249', isDefault: true },
    { text: 'MyRoom', value: '000024,000387', isDefault: true },
    { text: 'その他', value: '000325,000183,000150,000368,000044', isDefault: true }
  ],

  /**
   * 専門部会のリスト（セレクトボックス）および管理UIを生成して画面に配置する
   */
  appendDropdown: function() {
    const _this = this;
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    
    if ($inputField.length === 0 || $targetCell.length === 0) return;
    if ($('#custom-code-list').length > 0) return; // 重複防止

    // --- 1. LocalStorageの初期化・データ取得 ---
    let savedCodes = localStorage.getItem(_this.STORAGE_KEY);
    if (!savedCodes) {
      // 初回起動時はデフォルト値を保存
      localStorage.setItem(_this.STORAGE_KEY, JSON.stringify(_this.defaultCodes));
      savedCodes = _this.defaultCodes;
    } else {
      savedCodes = JSON.parse(savedCodes);
    }

    // --- 2. UI要素の生成 ---
    // コンテナ（要素を綺麗に横並びにするため）
    const $container = $('<div>', {
      id: 'custom-code-container',
      css: { 'display': 'inline-flex', 'align-items': 'center', 'gap': '6px', 'vertical-align': 'middle' }
    });

    // ドロップダウン
    const $select = $('<select>', {
      id: 'custom-code-list',
      css: FUNCTION.styles.systemButton
    });

    // 新規登録用の入力欄とボタン
    const inputStyle = $.extend({}, FUNCTION.styles.systemButton, { 'background': '#ffffff', 'cursor': 'text' });
    
    const $titleInput = $('<input>', {
      type: 'text',
      id: 'custom-code-title-input',
      placeholder: '新規タイトル',
      css: $.extend({}, inputStyle, { 'width': '90px' })
    });

    const $valueInput = $('<input>', {
      type: 'text',
      id: 'custom-code-value-input',
      placeholder: 'コード(カンマ区切り)',
      css: $.extend({}, inputStyle, { 'width': '160px' })
    });

    const $addButton = $('<button>', {
      type: 'button',
      text: '登録',
      css: FUNCTION.styles.systemButton
    });

    const $delButton = $('<button>', {
      type: 'button',
      text: '削除',
      disabled: true, // 初期状態（未選択）は無効化
      css: $.extend({}, FUNCTION.styles.systemButton, { 'color': '#cc0000' })
    });

    // --- 3. ドロップダウンの選択肢を更新する関数 ---
    const updateDropdown = function() {
      $select.empty();
      $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
      
      const currentList = JSON.parse(localStorage.getItem(_this.STORAGE_KEY)) || _this.defaultCodes;
      
      currentList.forEach(function(item, index) {
        $select.append($('<option>', {
          value: item.value,
          text: item.text,
          data: { index: index, isDefault: item.isDefault }
        }));
      });
      $delButton.prop('disabled', true); // 更新後は削除ボタンを一度無効化
    };

    // 最初の選択肢割り当て
    updateDropdown();

    // --- 4. イベントハンドラの実装 ---
    // 選択変更時の挙動
    $select.on('change', function() {
      const selectedCodes = $(this).val();
      const $selectedOption = $(this).find('option:selected');
      const isDefault = $selectedOption.data('isDefault');

      if (selectedCodes) {
        $inputField.val(selectedCodes);
        $inputField.trigger('change');
      } else {
        $inputField.val('');
      }

      // デフォルト値以外のカスタムコードが選択されている場合のみ削除ボタンを有効化
      if (selectedCodes && !isDefault) {
        $delButton.prop('disabled', false);
      } else {
        $delButton.prop('disabled', true);
      }
    });

    // 登録ボタンクリック
    $addButton.on('click', function() {
      const title = $.trim($titleInput.val());
      const value = $.trim($valueInput.val()).replace(/\s+/g, ''); // 空白除去

      if (!title || !value) {
        alert('タイトルとコードの両方を入力してください。');
        return;
      }

      const currentList = JSON.parse(localStorage.getItem(_this.STORAGE_KEY)) || [];
      
      // 重複チェック
      const isDuplicate = currentList.some(item => item.text === title);
      if (isDuplicate) {
        alert('同じタイトルのコードセットが既に存在します。');
        return;
      }

      // 新規追加
      currentList.push({ text: title, value: value, isDefault: false });
      localStorage.setItem(_this.STORAGE_KEY, JSON.stringify(currentList));

      // 入力欄をクリアしてUIを更新
      $titleInput.val('');
      $valueInput.val('');
      updateDropdown();
      alert('「' + title + '」を登録しました。');
    });

    // 削除ボタンクリック
    $delButton.on('click', function() {
      const $selectedOption = $select.find('option:selected');
      const targetIndex = $selectedOption.data('index');
      const title = $selectedOption.text();

      if (targetIndex === undefined || $selectedOption.data('isDefault')) return;

      if (confirm('「' + title + '」を削除してもよろしいですか？')) {
        const currentList = JSON.parse(localStorage.getItem(_this.STORAGE_KEY)) || [];
        currentList.splice(targetIndex, 1); // 指定インデックスの要素を削除
        
        localStorage.setItem(_this.STORAGE_KEY, JSON.stringify(currentList));
        
        $inputField.val(''); // 入力欄をリセット
        updateDropdown();
      }
    });

    // --- 5. 画面への埋め込み ---
    // もともとあったオレンジ枠のインプット要素を非表示（hide）にする
    $('input[style*="69.26"], input[style*="25.6"]').hide();

    // 各要素をコンテナに詰めてターゲットセルに追加
    $container.append($select)
              .append($delButton)
              .append($('<span>', { text: '|', css: { 'color': '#ccc', 'margin': '0 4px' } }))
              .append($titleInput)
              .append($valueInput)
              .append($addButton);

    $targetCell.append($container);
  }
};


// ===================================================
// 担当校舎・高松Ｕカスタム（初期表示制御）
// ====================================================
FUNCTION.takamatsuCustom = {
  init: function() {
    // 該当するセレクトボックスをすべて取得し、1つずつ個別に安全に処理する
    $('select[name="tenpo_cd"], select[name="shop_cd"], select[name="tenpo"], select[name="main_tenpo_cd"]').each(function() {
      const $select = $(this);

      // セレクトボックスの中に「担当校舎(value="m")」が存在する場合
      if ($select.find('option[value="m"]').length > 0) {
        // 初期値が何であれ、担当校舎（m）に強制設定する
        $select.val('m');
      } else {
        // 「担当校舎」という選択肢が無いセレクトボックスであり、
        // かつ「高松Ｕ(b3701)」という選択肢を持っている場合のみ、高松Ｕに設定する
        if ($select.find('option[value="b3701"]').length > 0) {
          $select.val('b3701');
        }
      }
    });
  }
};

// ===================================================
// TODOリストカスタム（別タブ投げっぱなし高速自動化方式）
// ===================================================
FUNCTION.todoList_custom = {
  checkedIds: [],

  // 1. チェックボックス列の追加と右クリック階層型メニュー制御（UIを完全維持）
  appendCheckboxColumn: function() {
    const _this = this;
    const $table = $('table.tbl');
    if ($table.length === 0) return;

    _this.checkedIds = [];

    // ヘッダー行の右端に列を追加
    if ($table.find('tbody tr').first().find('.custom-header-cell').length === 0) {
      $table.find('tbody tr').first().append($('<td>', { text: '選択', class: 'custom-header-cell', style: 'font-weight:bold; text-align:center;' }));
    }

    // 通常のタスク行にチェックボックスを追加
    const $taskRows = $table.find('tbody tr[id^="td"]');
    $taskRows.each(function() {
      const $row = $(this);
      const rowId = $row.attr('id').replace('td', '');

      if ($row.find('.custom-todo-selector').length > 0) return;

      const $newTd = $('<td>', { style: 'text-align: center; vertical-align: middle;' });
      const $checkbox = $('<input>', {
        type: 'checkbox',
        class: 'custom-todo-selector',
        data: { id: rowId },
        css: { 'cursor': 'pointer', 'transform': 'scale(1.2)' }
      });

      $checkbox.on('change', function() {
        const taskId = $(this).data('id');
        if ($(this).prop('checked')) {
          if (!_this.checkedIds.includes(taskId)) {
            _this.checkedIds.push(taskId);
          }
        } else {
          _this.checkedIds = _this.checkedIds.filter(id => id !== taskId);
        }
      });

      $newTd.append($checkbox);
      $row.append($newTd);
    });

    // レイアウト崩れ対策
    $table.find('tbody tr[id^="tr-todo"]').each(function() {
      const $td = $(this).find('td[colspan="10"]');
      if ($td.length > 0) {
        $td.attr('colspan', '11');
      }
    });

    // コンテキストメニュー用スタイルCSSを動的に注入（子メニュー横展開用）
    if ($('#custom-menu-style').length === 0) {
      $('<style>', {
        id: 'custom-menu-style',
        text: `
          #custom-context-menu { position: absolute; background: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 6px 0; z-index: 99999; min-width: 160px; font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10pt; }
          .menu-item { position: relative; padding: 8px 14px; cursor: pointer; color: #333; transition: background 0.2s; }
          .menu-item:hover { background-color: #f0f4f9; }
          .menu-item .arrow { float: right; font-size: 8pt; color: #888; margin-top: 2px; }
          .submenu { display: none; position: absolute; left: 100%; top: -6px; background: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 6px 0; min-width: 130px; }
          .menu-item:hover > .submenu { display: block; }
        `
      }).appendTo('head');
    }

    // テーブル内での右クリックでオリジナルメニューを表示
    $table.on('contextmenu', function(e) {
      if (_this.checkedIds.length > 0) {
        e.preventDefault();
        $('#custom-context-menu').remove();

        const $menu = $('<div>', { id: 'custom-context-menu' }).css({ 'top': e.pageY + 'px', 'left': e.pageX + 'px' });

        // --- ① 担当者削除メニュー ---
        const $itemTanto = $('<div>', { class: 'menu-item', html: '👤 担当者削除 <span class="arrow">▶</span>' });
        const $subTanto = $('<div>', { class: 'submenu' });
        [['平本 晃大', '000387'], ['古川 泰治', '000235']].forEach(t => {
          $('<div>', { class: 'menu-item', text: t[0] }).on('click', function() {
            _this.startAutomationLoop('delete_tanto', t[1]);
          }).appendTo($subTanto);
        });
        $itemTanto.append($subTanto).appendTo($menu);

        // --- ② 状態変更メニュー ---
        const $itemJyotai = $('<div>', { class: 'menu-item', html: '⚙️ 状態変更 <span class="arrow">▶</span>' });
        const $subJyotai = $('<div>', { class: 'submenu' });
        [
          ['未確認', '0'], ['未着手', 'A'], ['作業中', 'D'], 
          ['完了', 'F'], ['中断中', 'P'], ['中止', 'C'], ['削除', 'X']
        ].forEach(j => {
          $('<div>', { class: 'menu-item', text: j[0] }).on('click', function() {
            _this.startAutomationLoop('change_status', j[1]);
          }).appendTo($subJyotai);
        });
        $itemJyotai.append($subJyotai).appendTo($menu);

        // --- ③ 進捗率変更メニュー ---
        const $itemProgress = $('<div>', { class: 'menu-item', html: '📈 進捗率変更 <span class="arrow">▶</span>' });
        const $subProgress = $('<div>', { class: 'submenu' });
        $('<div>', { class: 'menu-item', text: '100%' }).on('click', function() {
          _this.startAutomationLoop('change_progress', '100');
        }).appendTo($subProgress);
        $itemProgress.append($subProgress).appendTo($menu);

        $('body').append($menu);
      }
    });

    // 画面のどこかをクリックしたらメニューを閉じる
    $(document).on('click.customMenuClose', function(e) {
      if (!$(e.target).closest('#custom-context-menu').length) {
        $('#custom-context-menu').remove();
      }
    });

    // 一覧更新時リreset
    $('input[onclick="formreload()"]').on('click', function() {
      _this.checkedIds = [];
      $('#custom-context-menu').remove();
    });
  },

  // 2. 自動化処理の実行（新方式：300ms間隔でのポップアップブロック回避別タブ連続オープナー）
  startAutomationLoop: function(action, value) {
    const _this = this;
    $('#custom-context-menu').remove();

    if (_this.checkedIds.length === 0) return;

    const queue = [..._this.checkedIds];
    console.log('【自動化開始 (別タブ自律型)】対象件数: ' + queue.length + '件');

    let index = 0;
    const intervalId = setInterval(function() {
      if (index >= queue.length) {
        clearInterval(intervalId);
        console.log('【タブ展開完了】すべての別タブを時間差で開きました。一覧画面をリロードします。');
        
        // メインの一覧画面側は一足先にリロードして実行完了を待つ
        _this.checkedIds = [];
        if (typeof formreload === 'function') {
          formreload();
        } else {
          location.reload();
        }
        return;
      }

      const taskId = queue[index];
      // クエリパラメータに命令アクションと値を埋め込んで安全にURLを生成
      const targetUrl = window.location.origin + 
        '/netz/netz1/todo/todo_input.aspx?id=' + taskId + 
        '&custom_action=' + action + 
        '&custom_val=' + encodeURIComponent(value);

      // window.open の代わりに background.js へメッセージを送信して完全に裏（非アクティブ）で開く
      chrome.runtime.sendMessage({ openTabBack: targetUrl });
      console.log(' -> バックグラウンドタブ起動指示: ' + targetUrl);

      index++;
    }, 300); // 0.3秒間隔でポップアップブロック制限をすり抜ける
  }
};

// ===================================================
// TODOリスト修正画面カスタム（別タブ側で勝手に動いて閉じる自律ロジック）
// ===================================================
FUNCTION.todoInput_custom = {
  executeAutomation: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('custom_action');
    const val = urlParams.get('custom_val');

    // 通常の手動アクセス（カスタムパラメータ無し）の場合は自動エミュレートを走らせず終了
    if (!action) return;

    console.log('【別タブ自律自動化稼働中】指示アクション: ' + action + ', 値: ' + val);

    // ★超重要: 登録完了時に出現するalertポップアップによる画面フリーズを完全に制御して無効化
    window.alert = function(msg) { console.log('【システムAlertを検知しスルーしました】:', msg); };
    window.confirm = function(msg) { console.log('【システムConfirmを検知し自動承認しました】:', msg); return true; };

    // 1. パラメータに合わせたフロント要素の書き換えエミュレート
    if (action === 'change_status') {
      // ⚙️ 状態変更
      const $select = $('select[name="jyotai_cb"]');
      if ($select.length > 0) {
        $select.val(val).trigger('change');
      }
    } 
    else if (action === 'change_progress') {
      // 📈 進捗率変更
      const $progress = $('#progress_vl, input[name="progress_vl"]');
      if ($progress.length > 0) {
        $progress.val(val).trigger('change');
      }
    } 
    else if (action === 'delete_tanto') {
      // 👤 担当者削除 (id="delcd000387" などの「×」ボタン削除スパンを直接狙い撃ち)
      const $delSpan = $('#delcd' + val);
      if ($delSpan.length > 0) {
        $delSpan.trigger('click');
      }
    }

    // 2. 登録ボタンの自動クリック（微小ウェイトを入れ、値の変更イベントを確実に反映）
    setTimeout(function() {
      const $submitBtn = $('#b_submit, input[name="b_submit"], input[value="登録"]');
      if ($submitBtn.length > 0) {
        console.log(' -> 登録ボタンを自動実行して保存します。');
        $submitBtn.trigger('click');
        // 保存リクエスト完了後、システム本来の仕様（パターンA）により、alertを通過して自動でタブが閉じます。
      }
    }, 400);
  }
};

// ===================================================
// 汎用テーブルExcel風フィルター機能（無名テーブル・カスタムID完全連動版）
// ====================================================
FUNCTION.tableExcelFilter = {
  init: function($table) {
    if (!$table || $table.length === 0) return;

    // テーブルが属している「ウィンドウ」と「body」を特定（子フレーム対応）
    const targetWindow = $table[0].ownerDocument.defaultView;
    const $targetBody = $($table[0].ownerDocument.body);

    // 1. ヘッダー行の特定
    let $headerRow = $table.find('thead tr').first();
    if ($headerRow.length === 0) {
      $headerRow = $table.find('tbody tr').first();
    }
    if ($headerRow.length === 0) return;

    // 2. 【完全修正】データ行（"td" "tr" または自動付与された "custom-td" で始まるtr）を柔軟に抽出
    const $dataRows = $table.find('tbody tr, tr').filter(function() {
      const rowId = $(this).attr('id');
      return rowId && (
        rowId.indexOf('td') === 0 || 
        rowId.indexOf('tr') === 0 || 
        rowId.indexOf('custom-td') === 0
      );
    });
    if ($dataRows.length === 0) return;

    // 古いメニューがあればクリア
    $targetBody.find('.custom-filter-floating-menu').remove();

    // スタイルCSSを注入
    if ($table[0].ownerDocument.getElementById('custom-filter-popup-style') === null) {
      $('<style>', {
        id: 'custom-filter-popup-style',
        text: `
          .filter-btn { display: inline-block; padding: 0 4px; height: 16px; line-height: 14px; font-size: 8pt; border: 1px solid #666; border-radius: 3px; background: linear-gradient(to bottom, #fff 0%, #e1e1e1 100%); cursor: pointer; user-select: none; color: #111; font-weight: normal; margin-left: 4px; vertical-align: middle; }
          .filter-btn.active { background: #b3d4fc; border-color: #3388ff; font-weight: bold; }
          
          .custom-filter-floating-menu { 
            display: none; 
            position: absolute; 
            background: #ffffff !important; 
            border: 1px solid #999999 !important; 
            border-radius: 4px !important; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important; 
            padding: 6px !important; 
            z-index: 2147483647 !important; 
            min-width: 150px; 
            max-height: 260px; 
            overflow-y: auto; 
            text-align: left;
            font-family: sans-serif;
          }
          
          .filter-sort-section { border-bottom: 1px solid #ddd; margin-bottom: 6px; padding-bottom: 4px; }
          .filter-sort-btn { display: block; width: 100%; text-align: left; background: none; border: none; padding: 4px 6px; font-size: 9pt; color: #333; cursor: pointer; border-radius: 2px; }
          .filter-sort-btn:hover { background-color: #f0f4f9; color: #0056b3; }
          
          .filter-item-list { max-height: 140px; overflow-y: auto; }
          .filter-item { display: flex; align-items: center; padding: 3px 6px; font-size: 9pt; color: #333; cursor: pointer; white-space: nowrap; margin: 0; }
          .filter-item:hover { background-color: #f0f4f9; }
          .filter-item input[type="checkbox"] { margin: 0 6px 0 0; padding: 0; vertical-align: middle; cursor: pointer; }
          
          .filter-actions { border-top: 1px solid #ddd; margin-top: 6px; padding-top: 4px; text-align: right; }
          .filter-action-btn { font-size: 8pt; padding: 1px 6px; cursor: pointer; border: 1px solid #bbb; background: #f5f5f5; border-radius: 2px; }
          .filter-action-btn:hover { background: #e5e5e5; }
        `
      }).appendTo($table[0].ownerDocument.head);
    }

    // 3. 各ヘッダーセルをスキャン
    $headerRow.find('td, th').each(function(colIndex) {
      const $headerCell = $(this);
      
      if ($headerCell.find('.filter-btn').length > 0) return;

      const headerText = $.trim($headerCell.text());
      if (headerText === '' || headerText === ' ' || $headerCell.find('input[type="button"], button').length > 0) return;

      // ユニークリストの抽出
      const uniqueValues = [];
      $dataRows.each(function() {
        const $targetTd = $(this).find('td').eq(colIndex);
        if ($targetTd.length === 0) return;
        
        let cellText = $targetTd.clone().children('select, input, script, style').remove().end().text();
        cellText = $.trim(cellText);

        if (cellText !== '' && $.inArray(cellText, uniqueValues) === -1) {
          uniqueValues.push(cellText);
        }
      });

      if (uniqueValues.length <= 1) return;
      uniqueValues.sort();

      // ① ボタンをヘッダーセルの中に配置
      const $button = $('<div>', { class: 'filter-btn', text: '▼', id: 'filter-btn-col-' + colIndex });
      $headerCell.css('white-space', 'nowrap').append($button);

      // ② メニュー本体の生成
      const $menu = $('<div>', { 
        class: 'custom-filter-floating-menu', 
        id: 'filter-menu-col-' + colIndex,
        data: { 'col-index': colIndex }
      });

      // 並べ替え（ソート）セクション
      const $sortSection = $('<div>', { class: 'filter-sort-section' });
      const $sortAscBtn = $('<button>', { type: 'button', class: 'filter-sort-btn', html: '🔼 昇順で並べ替え' });
      const $sortDescBtn = $('<button>', { type: 'button', class: 'filter-sort-btn', html: '🔽 降順で並べ替え' });

      $sortAscBtn.on('click', function(e) {
        e.stopPropagation();
        FUNCTION.tableExcelFilter.sortRows($table, colIndex, 'asc');
        $menu.hide();
      });

      $sortDescBtn.on('click', function(e) {
        e.stopPropagation();
        FUNCTION.tableExcelFilter.sortRows($table, colIndex, 'desc');
        $menu.hide();
      });

      $sortSection.append($sortAscBtn).append($sortDescBtn);
      $menu.append($sortSection);

      // チェックボックスリストセクション
      const $itemList = $('<div>', { class: 'filter-item-list' });
      $.each(uniqueValues, function(i, val) {
        const $item = $('<label>', { class: 'filter-item' });
        const $checkbox = $('<input>', { 
          type: 'checkbox', 
          value: val, 
          class: 'filter-check-val',
          checked: true
        });
        
        const displayVal = val.length > 14 ? val.substring(0, 14) + '...' : val;
        $item.append($checkbox).append($('<span>', { text: displayVal }));
        $itemList.append($item);
      });
      $menu.append($itemList);

      // アクションボタン
      const $actions = $('<div>', { class: 'filter-actions' });
      const $clearBtn = $('<button>', { type: 'button', class: 'filter-action-btn', text: 'クリア' });
      
      $clearBtn.on('click', function(e) {
        e.stopPropagation();
        const $checks = $menu.find('.filter-check-val');
        const anyChecked = $checks.filter(':checked').length > 0;
        $checks.prop('checked', !anyChecked).trigger('change');
        $(this).text(anyChecked ? '全選択' : 'クリア');
      });
      
      $actions.append($clearBtn);
      $menu.append($actions);
      
      // 子フレームのbodyに追加
      $targetBody.append($menu);

      // ▼ クリックイベント
      $button.on('click', function(e) {
        e.stopPropagation();
        $targetBody.find('.custom-filter-floating-menu').not($menu).hide();

        if ($menu.is(':visible')) {
          $menu.hide();
        } else {
          const btnOffset = $button.offset();
          const btnHeight = $button.outerHeight();
          $menu.css({
            top: (btnOffset.top + btnHeight) + 'px',
            left: btnOffset.left + 'px'
          }).fadeIn(100);
        }
      });

      // チェック変更イベント
      $menu.on('change', '.filter-check-val', function() {
        const $checks = $menu.find('.filter-check-val');
        const checkedCount = $checks.filter(':checked').length;
        $clearBtn.text(checkedCount > 0 ? 'クリア' : '全選択');

        FUNCTION.tableExcelFilter.executeFilter($headerRow, $dataRows, $targetBody);
      });
    });

    // メニュー外クリックで閉じる
    $(targetWindow.document).off('click.filterMenuClose').on('click.filterMenuClose', function(e) {
      if (!$(e.target).closest('.custom-filter-floating-menu, .filter-btn').length) {
        $targetBody.find('.custom-filter-floating-menu').hide();
      }
    });
  },

  /**
   * 行データを昇順・降順に物理的に並び替えるロジック
   */
  sortRows: function($table, colIndex, direction) {
    const $parent = $table.find('tbody').length > 0 ? $table.find('tbody') : $table;
    
    // ソート対象行の条件式も同様に custom-td に拡張
    const rows = $parent.find('tr').filter(function() {
      const rowId = $(this).attr('id');
      return rowId && (
        rowId.indexOf('td') === 0 || 
        rowId.indexOf('tr') === 0 || 
        rowId.indexOf('custom-td') === 0
      );
    }).get();

    rows.sort(function(a, b) {
      let cellA = $(a).find('td').eq(colIndex).clone().children('select, input, script, style').remove().end().text();
      let cellB = $(b).find('td').eq(colIndex).clone().children('select, input, script, style').remove().end().text();
      
      cellA = $.trim(cellA);
      cellB = $.trim(cellB);

      const numA = parseFloat(cellA.replace(/,/g, ''));
      const numB = parseFloat(cellB.replace(/,/g, ''));

      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      } else {
        return direction === 'asc' ? cellA.localeCompare(cellB, 'ja') : cellB.localeCompare(cellA, 'ja');
      }
    });

    $.each(rows, function(index, row) {
      $parent.append(row);
    });

    // 特殊行（合計行など）の定位置維持ルール
    const $totalRows = $parent.find('tr').filter(function() {
      const rowId = $(this).attr('id');
      return !rowId || (
        rowId.indexOf('td') !== 0 && 
        rowId.indexOf('tr') !== 0 && 
        rowId.indexOf('custom-td') !== 0
      );
    });
    $totalRows.each(function() {
      $parent.append(this);
    });
  },

  /**
   * フィルタリングの実行
   */
  executeFilter: function($headerRow, $dataRows, $targetBody) {
    const activeFilters = [];

    $targetBody.find('.custom-filter-floating-menu').each(function() {
      const $menu = $(this);
      const colIndex = $menu.data('col-index');
      const $allChecks = $menu.find('.filter-check-val');
      const $checkedValues = $allChecks.filter(':checked').map(function() { return $(this).val(); }).get();
      const $relatedBtn = $headerRow.find('#filter-btn-col-' + colIndex);

      if ($checkedValues.length < $allChecks.length) {
        activeFilters.push({
          colIndex: colIndex,
          allowedValues: $checkedValues
        });
        $relatedBtn.addClass('active');
      } else {
        $relatedBtn.removeClass('active');
      }
    });

    $dataRows.each(function() {
      const $row = $(this);
      let isMatch = true;

      $.each(activeFilters, function(i, filter) {
        let rowCellText = $row.find('td').eq(filter.colIndex).clone().children('select, input, script, style').remove().end().text();
        rowCellText = $.trim(rowCellText);

        if (filter.allowedValues.length === 0 || $.inArray(rowCellText, filter.allowedValues) === -1) {
          isMatch = false;
          return false;
        }
      });

      if (isMatch) {
        $row.show();
      } else {
        $row.hide();
      }
    });
  }
};

// ===================================================
// ★ 連絡事項画面プルダウンメニューのボタン化カスタム（厳選版・全ページ網羅）
// ===================================================
FUNCTION.studentRenrakuButtons = {
  // 💡 ご提示いただいた26個の厳選リストです。
  // この配列の並び順の通りに、画面に左からボタンが生成されます。
  allowedValues: [
    '1',     // 家庭情報（旧詳細情報）
    '2',     // 契約情報
    '5',     // 連絡事項
    '8',     // 志望校入力
    '9',     // 指導予定
    'a',     // 規定回数｜西日本
    'f',     // 振替・キャンセル
    'fcc',   // 振替・キャンセル（コールセンター用）
    't',     // テキスト発注情報
    'b',     // 手配情報
    'g',     // 基本ブース｜50・100分
    'z',     // 講座管理
    'm',     // 申込書作成
    'k',     // 関連情報
    'aa',    // 指導報告
    'ml',    // メールアドレス
    'io',    // 入退館情報
    'sm',    // 指導予定メール
    'prof',  // プロファイル
    'so',    // 都度請求
    'gm',    // カード登録依頼
    'fa',    // 未入塾兄弟
    'apps',  // myネッツS設定
    'code',  // 認証コード
    'tanto'  // 担任設定
  ],

  init: function() {
    const _this = this;
    
    // ページ内にある「開く」ボタンをすべて探す 
    const openButtons = document.querySelectorAll('input[type="button"][value="開く"]');

    openButtons.forEach(btn => {
      const onclickText = btn.getAttribute('onclick');
      if (!onclickText) return;
      
      // onclick属性から生徒IDを安全に抽出 
      const match = onclickText.match(/openform\(([^,]+),\s*'([^']+)'\)/);
      if (match) {
        const selectId = match[1];  // 例: d356387
        const studentCd = match[2]; // 例: 356387
        const selectEl = document.getElementById(selectId);
        const $formMenu = $('form[name="form_menu"]'); // 遷移用の隠しフォーム
        
        if (selectEl && $formMenu.length > 0) {
          // ボタンを綺麗に並べるためのコンテナを作成
          const container = document.createElement('div');
          container.style.display = 'inline-block';
          container.style.verticalAlign = 'middle';

          // プルダウンの選択肢(option)をループ 
          Array.from(selectEl.options).forEach(option => {
            // ★ 指定された厳選リスト（allowedValues）に含まれているものだけをボタン化する
            if (!_this.allowedValues.includes(option.value)) return;

            const newBtn = document.createElement('input');
            newBtn.type = 'button';
            newBtn.value = option.text;
            
            // 既存のシステムボタンのデザイン・高さを100%同期
            Object.assign(newBtn.style, FUNCTION.styles.systemButton);
            newBtn.style.marginLeft = '4px'; // ボタン同士の間隔

            // 擬似的な発火処理（拡張機能から安全に直接フォームを書き換えてsubmitします）
            newBtn.onclick = function() {
              let actionUrl = '';
              let targetName = '';

              // 💡 今後のため、プルダウンに存在するすべての全ページのコードを埋め込んであります
              switch (option.value) {
                case "1":    actionUrl = "../student_data_input.aspx";       targetName = "student_data"; break;
                case "2":    actionUrl = "../k/student_keiyaku_data.aspx";   targetName = "keiyaku_data"; break;
                case "3":    actionUrl = "../u/uriage_input.aspx";           targetName = "uriage_input"; break;
                case "4":    actionUrl = "../u/uriage_addnew.aspx";          targetName = "uriage_addnew"; break;
                case "5":    actionUrl = "../s/student_renraku_list.aspx";   targetName = "student_renraku_list"; break;
                case "6":    actionUrl = "../seiseki/seiseki_list.aspx";     targetName = "seiseki"; break;
                case "7":    actionUrl = "../student_kouza_input.aspx";      targetName = "kouza"; break;
                case "8":    actionUrl = "../s/shibo_input.aspx";            targetName = "shibo"; break;
                case "9":    actionUrl = "../kanren/student_shido_yotei.aspx"; targetName = "shido_yotei_s" + studentCd; break;
                case "a":    actionUrl = "../kanren/student_kaisu_list3.aspx"; targetName = "student_kaisu_list"; break;
                case "ak":   actionUrl = "../kanren/student_kaisu_list3_k.aspx"; targetName = "student_kaisu_list"; break;
                case "ah":   actionUrl = "../kanren/student_kaisu_list3_h.aspx"; targetName = "student_kaisu_list"; break;
                case "ao":   actionUrl = "../kanren/student_kaisu_list3_o.aspx"; targetName = "student_kaisu_list"; break;
                case "f":    actionUrl = "../tehai/furikae_list.aspx";       targetName = "furikae_list"; break;
                case "fcc":  actionUrl = "../callcenter/furikae_frame.aspx"; targetName = "furikae_list"; break;
                case "t":    actionUrl = "../text/text_list_body.aspx";      targetName = "text_order"; break;
                case "b":    actionUrl = "../tehai/student_tehai_list.aspx"; targetName = "student_tehai"; break;
                case "g":    actionUrl = "../tehai/shido2_base_input.aspx";  targetName = "shido_base_input"; break;
                case "gk":   actionUrl = "../tehai/shido2_base_input_k.aspx"; targetName = "shido_base_input"; break;
                case "gh":   actionUrl = "../tehai/shido2_base_input_h.aspx"; targetName = "shido_base_input"; break;
                case "gf":   actionUrl = "../tehai/shido2_base_input_f.aspx"; targetName = "shido_base_input"; break;
                case "gn":   actionUrl = "../tehai/shido2_base_input_n.aspx"; targetName = "shido_base_input"; break;
                case "z":    actionUrl = "../shingaku/student_shingaku_list.aspx"; targetName = "student_shingaku_list"; break;
                case "s":    actionUrl = "../s/student_schedule_list.aspx";  targetName = "student_schedule"; break;
                case "m":    actionUrl = "../k/student_moshikomi_list.aspx"; targetName = "student_moshikomi_list"; break;
                case "sr":   actionUrl = "../t/teacher_research_input_select.aspx"; targetName = "teacher_research_input_select"; break;
                case "te":   actionUrl = "../s/student_teian_list.aspx";     targetName = "student_teian_list"; break;
                case "d":    actionUrl = "../u/student_seikyu_list.aspx";    targetName = "student_seikyu"; break;
                case "k":    actionUrl = "../tehai/tehai_kanren_list.aspx";  targetName = "kanren_list"; break;
                case "aa":   actionUrl = "../kanren/student_shido_kiroku_list.aspx"; targetName = "student_shido_kiroku_list"; break;
                case "ab":   actionUrl = "../s/tangen_check.aspx";           targetName = "tangen_check"; break;
                case "ac":   actionUrl = "../s/student_yearplan_list.aspx";  targetName = "student_yearplan_list"; break;
                case "sp":   actionUrl = "../s/student_studyplan_list.aspx"; targetName = "student_studyplan_list"; break;
                case "tl":   actionUrl = "../s/student_teacher_list.aspx";   targetName = "student_teacher_list"; break;
                case "h":    actionUrl = "../u/student_henkin_list.aspx";    targetName = "student_henkin_list"; break;
                case "ml":   actionUrl = "../s/student_mailaddress_input_init.aspx"; targetName = "student_mailaddress_input"; break;
                case "io":   actionUrl = "../s/student_inout_list.aspx";     targetName = "student_inout_list"; break;
                case "sm":   actionUrl = "../s/schedule_mail_input.aspx";    targetName = "schedule_mail_input"; break;
                case "prof": actionUrl = "../s/student_profile_input.aspx";  targetName = "student_profile_input"; break;
                case "if":   actionUrl = "../s/student_info_input.aspx";     targetName = "student_info_input"; break;
                case "so":   actionUrl = "../u/student_seikyu_order_list.aspx"; targetName = "student_seikyu_order_list"; break;
                case "gm":   actionUrl = "../u/student_kouza_gmo_input.aspx"; targetName = "student_kouza_gmo_input"; $formMenu.find('input[name="family_cd"]').val(studentCd); break;
                case "to":   actionUrl = "../toiawase_input.aspx";           targetName = "toiawase_input"; break;
                case "fa":   actionUrl = "../s/student_family_input.aspx";   targetName = "student_family_input"; break;
                case "todo": actionUrl = "../todo/todo_list.aspx";           targetName = "todo_list"; $formMenu.find('input[name="user_cd"]').val(studentCd); break;
                case "ai":   actionUrl = "../ai/student_ai_mokuhyo_input.aspx"; targetName = "student_ai_mokuhyo_input"; break;
                case "apps": actionUrl = "../apps/mynetzs_info.aspx";        targetName = "mynetzs_info"; break;
                case "code": actionUrl = "../s/mynetz_code.aspx";            targetName = "mynetz_code"; break;
                case "tanto": actionUrl = "../s/student_tanto_input.aspx";   targetName = "student_tanto_list"; break;
                case "kyo":  actionUrl = "../s/student_kyokasho_input.aspx"; targetName = "student_kyokasho_input"; break;
                case "pdca": actionUrl = "../ai/pdca_input.aspx";            targetName = "pdca_input"; break;
                
                // アプリ連携（SSO・モバイルメニュー系）
                case "sche": case "sei": case "aav": case "ict": case "dsa": case "k100m": case "sya": case "kyomu":
                  actionUrl = "../sso/mobilenetzmenu.aspx";
                  targetName = option.value + studentCd;
                  $formMenu.find('#app_name').val("forlecturer");
                  $formMenu.find('#page_kind').val("3");
                  $formMenu.find('#method_name').val(
                    option.value === "sche" ? "tsuujuku" :
                    option.value === "sei" ? "seiseki" :
                    option.value === "aav" ? "shidouhoukoku" :
                    option.value === "ict" ? "ictcontents" :
                    option.value === "dsa" ? "studyachivement" :
                    option.value === "k100m" ? "kakomon100" :
                    option.value === "sya" ? "shidouyotei" : "tannincheck"
                  );
                  break;
              }

              // 該当するメニュー定義があった場合のみ安全に送信を実行
              if (actionUrl) {
                $formMenu.attr('action', actionUrl);
                $formMenu.attr('target', targetName);
                $formMenu.find('input[name="student_cd"]').val(studentCd);
                $formMenu[0].submit();
              }
            };
            
            container.appendChild(newBtn);
          });

          // 元の不要になったプルダウンと「開く」ボタンを画面から非表示にする 
          selectEl.style.display = 'none';
          btn.style.display = 'none';

          // 新しく生成した綺麗に並んだボタン群を画面に流し込む 
          btn.parentNode.insertBefore(container, btn);
        }
      }
    });
  }
};

// ===================================================
// 未手配表カスタム（別タブ投げっぱなし高速自動化方式）
// ===================================================
FUNCTION.tehaiList_custom = {
  checkedIds: [],

  appendCheckboxColumn: function() {
    const _this = this;
    const $table = $('table.tbl');
    if ($table.length === 0) return;

    _this.checkedIds = [];

    // ヘッダー行の右端に列を追加
    if ($table.find('tbody tr').first().find('.custom-header-cell').length === 0) {
      $table.find('tbody tr').first().append($('<td>', { text: '選択', class: 'custom-header-cell', style: 'font-weight:bold; text-align:center;' }));
    }

    // 通常のデータ行にチェックボックスを追加 (id="td"で始まるtrを対象にする)
    const $taskRows = $table.find('tbody tr[id^="td"]');
    $taskRows.each(function() {
      const $row = $(this);
      const rowId = $row.attr('id').replace('td', '');

      if ($row.find('.custom-tehai-selector').length > 0) return;

      const $newTd = $('<td>', { style: 'text-align: center; vertical-align: middle;' });
      const $checkbox = $('<input>', {
        type: 'checkbox',
        class: 'custom-tehai-selector',
        data: { id: rowId },
        css: { 'pointer': 'pointer', 'transform': 'scale(1.2)' }
      });

      $checkbox.on('change', function() {
        const taskId = $(this).data('id');
        if ($(this).prop('checked')) {
          if (!_this.checkedIds.includes(taskId)) {
            _this.checkedIds.push(taskId);
          }
        } else {
          _this.checkedIds = _this.checkedIds.filter(id => id !== taskId);
        }
      });

      $newTd.append($checkbox);
      $row.append($newTd);
    });

    // 各種カスタムダイアログのスタイル注入
    if ($('#custom-tehai-menu-style').length === 0) {
      $('<style>', {
        id: 'custom-tehai-menu-style',
        text: `
          #custom-tehai-context-menu { position: absolute; background: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 6px 0; z-index: 99999; min-width: 180px; font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10pt; }
          .tehai-menu-item { position: relative; padding: 8px 14px; cursor: pointer; color: #333; transition: background 0.2s; }
          .tehai-menu-item:hover { background-color: #f0f4f9; }
          .tehai-menu-item .arrow { float: right; font-size: 8pt; color: #888; margin-top: 2px; }
          .tehai-submenu { display: none; position: absolute; left: 100%; top: -6px; background: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 6px 0; min-width: 140px; }
          .tehai-menu-item:hover > .tehai-submenu { display: block; }
          
          #custom-tehai-dialog-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 100000; display: flex; align-items: center; justify-content: center; }
          .custom-tehai-dialog { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 12px; width: 320px; font-family: sans-serif; font-size: 10pt; }
          .custom-tehai-dialog h4 { margin: 0 0 5px 0; color: #333; font-size: 11pt; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .custom-tehai-dialog label { display: flex; flex-direction: column; gap: 4px; color: #666; }
          .custom-tehai-dialog input[type="date"] { padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 10pt; }
          
          .custom-subject-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f0f0f0; }
          .custom-subject-label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #333 !important; flex-direction: row !important; }
          .custom-subject-row input[type="checkbox"] { transform: scale(1.1); cursor: pointer; }
          .custom-subject-row input[type="text"] { width: 45px; text-align: center; padding: 3px; border: 1px solid #ccc; border-radius: 4px; font-size: 9pt; }
          .custom-subject-row input[type="text"]:disabled { background: #f5f5f5; color: #aaa; }
          
          .custom-tehai-btn-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 5px; }
          .custom-tehai-btn { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #f5f5f5; cursor: pointer; font-size: 9pt; }
          .custom-tehai-btn.primary { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        `
      }).appendTo('head');
    }

    // テーブル内での右クリックでオリジナルメニューを表示
    $table.on('contextmenu', function(e) {
      if (_this.checkedIds.length > 0) {
        e.preventDefault();
        $('#custom-tehai-context-menu').remove();

        const $menu = $('<div>', { id: 'custom-tehai-context-menu' }).css({ 'top': e.pageY + 'px', 'left': e.pageX + 'px' });

        // --- ① 状態変更レイヤー ---
        const $itemJyotai = $('<div>', { class: 'tehai-menu-item', html: '⚙️ 状態変更 <span class="arrow">▶</span>' });
        const $subJyotai = $('<div>', { class: 'tehai-submenu' });
        [
          ['未手配', '0'], ['自動処理', '2'], ['手配中', '1'], ['手配済', '5'], ['取消', '9']
        ].forEach(j => {
          $('<div>', { class: 'tehai-menu-item', text: j[0] }).on('click', function() {
            _this.startAutomationLoop('change_status', j[1]);
          }).appendTo($subJyotai);
        });
        $itemJyotai.append($subJyotai).appendTo($menu);

        // --- ② 講習日時変更レイヤー ---
        const $itemDate = $('<div>', { class: 'tehai-menu-item', html: '📅 講習日時設定 <span class="arrow">▶</span>' });
        const $subDate = $('<div>', { class: 'tehai-submenu' });
        $('<div>', { class: 'tehai-menu-item', text: '🗓️ カレンダーから選択' }).on('click', function() {
          _this.openDateDialog();
        }).appendTo($subDate);
        $itemDate.append($subDate).appendTo($menu);

        // --- ③ 指導科目レイヤー（複数選択可カスタムダイアログ起動） ---
        const $itemKyoka = $('<div>', { class: 'tehai-menu-item', html: '📚 指導科目チェック <span class="arrow">▶</span>' });
        const $subKyoka = $('<div>', { class: 'tehai-submenu' });
        $('<div>', { class: 'tehai-menu-item', text: '📝 複数科目をまとめて指定' }).on('click', function() {
          _this.openSubjectDialog();
        }).appendTo($subKyoka);
        $itemKyoka.append($subKyoka).appendTo($menu);

        $('body').append($menu);
      }
    });

    $(document).on('click.customTehaiMenuClose', function(e) {
      if (!$(e.target).closest('#custom-tehai-context-menu').length) {
        $('#custom-tehai-context-menu').remove();
      }
    });
  },

  // カレンダー付き日付入力ダイアログ
  openDateDialog: function() {
    const _this = this;
    $('#custom-tehai-dialog-overlay').remove();

    const $overlay = $('<div>', { id: 'custom-tehai-dialog-overlay' });
    const $dialog = $('<div>', { class: 'custom-tehai-dialog' });

    $dialog.append($('<h4>', { text: '講習日時の範囲指定' }));

    const $labelFrom = $('<label>', { text: '開始日' }).append($('<input>', { type: 'date', id: 'c-date-from', value: '2026-03-01' }));
    const $labelTo = $('<label>', { text: '終了日' }).append($('<input>', { type: 'date', id: 'c-date-to', value: '2026-03-31' }));

    const $btnRow = $('<div>', { class: 'custom-tehai-btn-row' });
    const $cancelBtn = $('<button>', { type: 'button', class: 'custom-tehai-btn', text: 'キャンセル' }).on('click', function() { $overlay.remove(); });
    const $okBtn = $('<button>', { type: 'button', class: 'custom-tehai-btn primary', text: '適用する' }).on('click', function() {
      let fromVal = $('#c-date-from').val();
      let toVal = $('#c-date-to').val();

      if (!fromVal || !toVal) {
        alert('開始日と終了日の両方を指定してください。');
        return;
      }

      fromVal = fromVal.replace(/-/g, '/');
      toVal = toVal.replace(/-/g, '/');

      $overlay.remove();
      _this.startAutomationLoop('change_date', fromVal + ',' + toVal);
    });

    $btnRow.append($cancelBtn).append($okBtn);
    $dialog.append($labelFrom).append($labelTo).append($btnRow);
    $overlay.append($dialog).appendTo('body');
  },

  // 【新設】指導科目の複数選択＆回数入力ダイアログ
  openSubjectDialog: function() {
    const _this = this;
    $('#custom-tehai-dialog-overlay').remove();

    const $overlay = $('<div>', { id: 'custom-tehai-dialog-overlay' });
    const $dialog = $('<div>', { class: 'custom-tehai-dialog', css: { 'width': '340px' } });

    $dialog.append($('<h4>', { text: '指導科目の複数選択・回数指定' }));

    const subjects = [
      { id: 'kok', text: '国語' },
      { id: 'sha', text: '社会' },
      { id: 'sug', text: '数学' },
      { id: 'rik', text: '理科' },
      { id: 'eig', text: '英語' },
      { id: 'etc', text: '未振分' }
    ];

    // 科目ごとの入力エリアを生成
    subjects.forEach(s => {
      const $row = $('<div>', { class: 'custom-subject-row' });
      
      const $label = $('<label>', { class: 'custom-subject-label' })
        .append($('<input>', { type: 'checkbox', class: 'c-sub-chk', data: { id: s.id } }))
        .append($('<span>', { text: s.text }));
        
      const $input = $('<input>', { type: 'text', class: 'c-sub-val', id: 'c-sub-val-' + s.id, disabled: true, placeholder: '回数', value: '2' });

      // チェックボックスのON/OFFでテキストボックスの有効・無効を制御
      $label.find('input').on('change', function() {
        $input.prop('disabled', !$(this).prop('checked'));
      });

      $row.append($label).append($input);
      $dialog.append($row);
    });

    const $btnRow = $('<div>', { class: 'custom-tehai-btn-row' });
    const $cancelBtn = $('<button>', { type: 'button', class: 'custom-tehai-btn', text: 'キャンセル' }).on('click', function() { $overlay.remove(); });
    const $okBtn = $('<button>', { type: 'button', class: 'custom-tehai-btn primary', text: '適用する' }).on('click', function() {
      const selectedData = [];
      
      $dialog.find('.c-sub-chk:checked').each(function() {
        const subId = $(this).data('id');
        const countVal = $('#c-sub-val-' + subId).val() || '0';
        selectedData.push(subId + ':' + countVal); // 例: "kok:2"
      });

      if (selectedData.length === 0) {
        alert('少なくとも1つ以上の科目にチェックを入れてください。');
        return;
      }

      $overlay.remove();
      // パラメータをセミコロン区切りの文字列で引き渡す (例: "kok:2;sug:2;eig:2")
      _this.startAutomationLoop('change_subject_multi', selectedData.join(';'));
    });

    $btnRow.append($cancelBtn).append($okBtn);
    $dialog.append($btnRow);
    $overlay.append($dialog).appendTo('body');
  },

  startAutomationLoop: function(action, value) {
    const _this = this;
    $('#custom-tehai-context-menu').remove();

    if (_this.checkedIds.length === 0) return;

    const queue = [..._this.checkedIds];
    console.log('【手配自動化開始】対象件数: ' + queue.length + '件');

    let index = 0;
    const intervalId = setInterval(function() {
      if (index >= queue.length) {
        clearInterval(intervalId);
        _this.checkedIds = [];
        location.reload();
        return;
      }

      const tehaiCd = queue[index];
      const targetUrl = window.location.origin + 
        '/netz/netz1/tehai/tehai_input.aspx?tehai_cd=' + tehaiCd + 
        '&custom_action=' + action + 
        '&custom_val=' + encodeURIComponent(value);

      chrome.runtime.sendMessage({ openTabBack: targetUrl });
      index++;
    }, 300);
  }
};

// ===================================================
// 手配票入力画面カスタム（裏タブ自動書き換え・保存ロジック）
// ===================================================
FUNCTION.tehaiInput_custom = {
  executeAutomation: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('custom_action');
    const val = urlParams.get('custom_val');

    if (!action) return;

    window.alert = function(msg) { console.log('【Alertスルー】:', msg); };
    window.confirm = function(msg) { console.log('【Confirm自動承認】:', msg); return true; };

    if (action === 'change_status') {
      $('select[name="jyotai_cb"]').val(val).trigger('change');
    } 
    else if (action === 'change_date') {
      const dates = val.split(',');
      if (dates.length === 2) {
        $('#koshu_from, input[name="koshu_from"]').val(dates[0]).trigger('change');
        $('#koshu_to, input[name="koshu_to"]').val(dates[1]).trigger('change');
      }
    } 
    // 複数科目のチェック＆回数代入の処理
    else if (action === 'change_subject_multi') {
      // データのパース (例: "kok:2;sug:2;eig:2" ➔ { kok: "2", sug: "2", eig: "2" })
      const activeSubjects = {};
      val.split(';').forEach(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
          activeSubjects[parts[0]] = parts[1];
        }
      });
      
      ['kok', 'sha', 'sug', 'rik', 'eig', 'etc'].forEach(sub => {
        const $chk = $('#' + sub + ', input[name="shido_' + sub + '_flg"]');
        const $inputVl = $('input[name="shido_' + sub + '_vl"]');
        
        if ($chk.length > 0) {
          const isTarget = activeSubjects.hasOwnProperty(sub);
          // 選択された科目はチェックON、選択されなかった科目はチェックOFF
          $chk.prop('checked', isTarget).trigger('change');
          
          if ($inputVl.length > 0) {
            // 対象科目の場合は指定された回数を代入、それ以外は空欄クリア
            $inputVl.val(isTarget ? activeSubjects[sub] : '').trigger('change');
          }
        }
      });
    }

    setTimeout(function() {
      const $submitBtn = $('input[name="b_submit"], input[value=" 登録 "]');
      if ($submitBtn.length > 0) {
        if (typeof form_submit === 'function') {
          form_submit();
        } else {
          $submitBtn.trigger('click');
        }
      }
    }, 500);
  }
};

// 以下はもう一つ globalFunction.jsとか別ファイルを作ってそっちにいれるほうがいいかな
async function postData() {
  if (!endpoint) {
    console.log('missing target url');
    return null;
  }
  try {
    const response = await $.post(endpoint, body);
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    return data;
  } catch (error) {
    console.error('Fetch Error', error);
  }
}