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
  /**
   * 専門部会のリスト（セレクトボックス）を生成して画面に配置する
   */
  appendDropdown: function() {
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    
    if ($inputField.length === 0 || $targetCell.length === 0) return;

    // セレクトボックスを生成し、共通スタイルを上から一括適用！
    const $select = $('<select>', {
      id: 'custom-code-list',
      css: FUNCTION.styles.systemButton
    });

    // 選択肢の追加
    $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
    $select.append($('<option>', {value: '000360,000161,000325,000015,000387,000249',text: '専門部会'}));
    $select.append($('<option>', {value: '000024,000387',text: 'MyRoom'}));
    $select.append($('<option>', {value: '000325,000183,000150,000368,000044',text: 'その他'}));
    // 自動入力の挙動
    $select.on('change', function() {
      const selectedCodes = $(this).val();
      if (selectedCodes) {
        $inputField.val(selectedCodes);
        $inputField.trigger('change');
      } else {
        $inputField.val('');
      }
    });

    // もともとあったオレンジ枠のインプット要素を非表示（hide）にする
    $('input[style*="69.26"], input[style*="25.6"]').hide();

    // 画面に埋め込み
    $targetCell.append($select);
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