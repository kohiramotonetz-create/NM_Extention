console.log('functions.js imported.');

// 1. すべての基盤となるグローバルオブジェクトの宣言
const FUNCTION = {};

// ==================================================
// ★ デザイン・スタイルの一括管理
// ==================================================
FUNCTION.styles = {
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
// 汎用コア機能
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
  appendDropdown: function() {
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    
    if ($inputField.length === 0 || $targetCell.length === 0) return;

    const $select = $('<select>', {
      id: 'custom-code-list',
      css: FUNCTION.styles.systemButton
    });

    $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
    $select.append($('<option>', {
      value: '000360,000161,000325,000015,000387,000249',
      text: '専門部会'
    }));

    $select.on('change', function() {
      const selectedCodes = $(this).val();
      if (selectedCodes) {
        $inputField.val(selectedCodes);
        $inputField.trigger('change');
      } else {
        $inputField.val('');
      }
    });

    $('input[style*="69.26"], input[style*="25.6"]').hide();
    $targetCell.append($select);
  }
};

// --- 学年グループフィルター ---
FUNCTION.studentList_filter = {
  groups: {
    'non-受験生': ['小１', '小２', '小３', '小４', '小５', '小６', '一貫中１', '一貫中２', '一貫中３', '中１', '中２', '高１', '高２'],
    '受験生': ['受験小１', '受験小２', '受験小３', '受験小４', '受験小５', '受験小６', '中３', '高３', '大学受験']
  },

  appendFilterDropdown: function() {
    if ($('#custom-gakunen-group-filter').length > 0) return;

    const $btn = $('input[value="複数生徒番号指定画面"]');
    if ($btn.length === 0) return;

    const $targetCheckbox = $btn.nextAll('label[for="row_vl"]').first();
    if ($targetCheckbox.length === 0) return;

    const $groupSelect = $('<select>', {
      id: 'custom-gakunen-group-filter',
      css: FUNCTION.styles.systemButton
    });

    $groupSelect.append($('<option>', { value: 'all', text: '-- 学年一括フィルター --' }));
    $groupSelect.append($('<option>', { value: 'non-受験生', text: '非受験生 (小１～小６/一貫中１～３/中１～２/高１～２)' }));
    $groupSelect.append($('<option>', { value: '受験生', text: '受験生 (受験小/中３/高３/大受)' }));

    $groupSelect.on('change', function() {
      const selectedGroup = $(this).val();
      const $bodyFrame = $(parent.document).find('frame[name="student_list_body"]').contents();
      
      let gakunenIndex = -1;
      $bodyFrame.find('table.small thead tr td').each(function(index) {
        if ($.trim($(this).text()) === '学年') {
          gakunenIndex = index;
          return false;
        }
      });

      if (gakunenIndex === -1) {
        console.log('表の中に「学年」の列が見つかりません。');
        return;
      }

      const $rows = $bodyFrame.find('table.small tbody tr[id^="td"]');

      if (selectedGroup === 'all') {
        $rows.show();
      } else {
        const allowedGakunen = FUNCTION.studentList_filter.groups[selectedGroup];
        
        $rows.each(function() {
          const $row = $(this);
          const rowGakunen = $.trim($row.find('td').eq(gakunenIndex).text());

          if (allowedGakunen.includes(rowGakunen)) {
            $row.show();
          } else {
            $row.hide();
          }
        });
      }
    });

    $('input[name="b_submit"], input[name="b_submit2"]').on('click', function() {
      $groupSelect.val('all');
    });

    $targetCheckbox.after($groupSelect).after(' ');
  }
};

// --- 担当校舎・高松Ｕカスタム（初期表示制御） ---
FUNCTION.takamatsuCustom = {
  init: function() {
    $('select[name="tenpo_cd"], select[name="shop_cd"], select[name="tenpo"], select[name="main_tenpo_cd"]').each(function() {
      const $select = $(this);
      if ($select.find('option[value="m"]').length > 0) {
        $select.val('m');
      } else {
        if ($select.find('option[value="b3701"]').length > 0) {
          $select.val('b3701');
        }
      }
    });
  }
};

// ===================================================
// TODOリストカスタム（完全フロントインライン連動自動化方式）
// ===================================================
FUNCTION.todoList_custom = {
  checkedIds: [],
  executionQueue: [],
  currentAction: null,
  currentValue: null,

  // 1. チェックボックス列の追加と右クリックメニュー制御
  appendCheckboxColumn: function() {
    const _this = this;
    const $table = $('table.tbl');
    if ($table.length === 0) return;

    _this.checkedIds = [];

    // ヘッダー行の右端に列を追加
    if ($table.find('tbody tr').first().find('.custom-header-cell').length === 0) {
      $table.find('tbody tr').first().append($('<td>', { text: '選択', class: 'custom-header-cell', style: 'font-weight:bold; text-align:center;' }));
    }

    // 各タスク行にチェックボックスを追加
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
          if (!_this.checkedIds.includes(taskId)) _this.checkedIds.push(taskId);
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
      if ($td.length > 0) $td.attr('colspan', '11');
    });

    // コンテキストメニュー用スタイルCSSを動的に注入（子メニュー表示用）
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

    // 右クリックイベント
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

    $(document).on('click.customMenuClose', function(e) {
      if (!$(e.target).closest('#custom-context-menu').length) $('#custom-context-menu').remove();
    });

    $('input[onclick="formreload()"]').on('click', function() {
      _this.checkedIds = [];
      $('#custom-context-menu').remove();
    });
  },

  // 2. 自動化処理ループの初期化
  startAutomationLoop: function(action, value) {
    const _this = this;
    $('#custom-context-menu').remove();

    if (_this.checkedIds.length === 0) return;

    // キューの作成
    _this.executionQueue = [..._this.checkedIds];
    _this.currentAction = action;
    _this.currentValue = value;

    // バックグラウンド動作用の非表示隠し iframe が無ければ作成
    let $iframe = $('#custom-todo-worker');
    if ($iframe.length === 0) {
      $iframe = $('<iframe>', {
        id: 'custom-todo-worker',
        style: 'display:none; width:0; height:0;'
      }).appendTo('body');
    }

    console.log('【自動化開始】処理対象件数: ' + _this.executionQueue.length + '件');
    _this.executeNextQueue();
  },

  // 3. 再帰関数によるキューの順次処理
  executeNextQueue: function() {
    const _this = this;

    if (_this.executionQueue.length === 0) {
      console.log('【自動化完了】すべてのタスク処理が完了しました。一覧を更新します。');
      // 全て完了したら元のチェックボックスをリセットし、本来のリロード関数を叩く
      _this.checkedIds = [];
      if (typeof formreload === 'function') {
        formreload();
      } else {
        location.reload();
      }
      return;
    }

    const nextId = _this.executionQueue.shift();
    console.log('現在処理中 タスクID: ' + nextId + ' (残り: ' + _this.executionQueue.length + '件)');

    const $iframe = $('#custom-todo-worker');
    
    // iframeの読み込み完了イベントを一度だけバインド
    $iframe.off('load').on('load', function() {
      setTimeout(function() {
        _this.manipulateInputField(nextId);
      }, 800); // ロード後のAjax等による動的生成を見越して僅かにウェイト
    });

    // 規定のURL構造に合わせてiframe内を強制遷移させる
    const targetUrl = window.location.origin + '/netz/netz1/todo/todo_input.aspx?id=' + nextId;
    $iframe.attr('src', targetUrl);
  },

  // 4. 隠しiframe内のDOM解析・要素操作・エミュレート保存
  manipulateInputField: function(taskId) {
    const _this = this;
    const $iframe = $('#custom-todo-worker');
    const iframeWindow = $iframe[0].contentWindow;
    const $contents = $iframe.contents();

    // 登録ボタンの捕捉
    const $submitBtn = $contents.find('#b_submit, input[name="b_submit"], input[value="登録"]');

    // アラートポップアップが走ると処理が永久ストップするため事前に完全に上書き無効化
    if (iframeWindow) {
      iframeWindow.alert = function(msg) { console.log('【システムAlertを検知しスルー】:', msg); };
      iframeWindow.confirm = function(msg) { console.log('【システムConfirmを検知し自動承認】:', msg); return true; };
    }

    // まだ入力画面ではなく、保存完了後の別画面等にいる場合はスキップして次へ
    if ($submitBtn.length === 0 && $contents.find('select[name="jyotai_cb"]').length === 0) {
      console.log('入力フォーム要素が見つからないため、次のタスクへスキップします。');
      _this.executeNextQueue();
      return;
    }

    // 各種アクションのフロントエミュレート
    if (_this.currentAction === 'change_status') {
      // ⚙️ 状態変更
      const $select = $contents.find('select[name="jyotai_cb"]');
      if ($select.length > 0) {
        $select.val(_this.currentValue).trigger('change');
        console.log(' -> 状態を書き換えました: ' + _this.currentValue);
      }
    } 
    else if (_this.currentAction === 'change_progress') {
      // 📈 進捗率変更
      const $progress = $contents.find('#progress_vl, input[name="progress_vl"]');
      if ($progress.length > 0) {
        $progress.val(_this.currentValue).trigger('change');
        console.log(' -> 進捗率を書き換えました: ' + _this.currentValue + '%');
      }
    } 
    else if (_this.currentAction === 'delete_tanto') {
      // 👤 担当者削除
      // id="delcd000387" などの「×」ボタン要素をダイレクトに狙い撃ち
      const targetDelId = '#delcd' + _this.currentValue;
      const $delSpan = $contents.find(targetDelId);
      
      if ($delSpan.length > 0) {
        $delSpan.trigger('click');
        console.log(' -> 担当者コード: ' + _this.currentValue + ' の削除スパンをクリックしました。');
      } else {
        console.log(' -> 対象の担当者削除要素がこのタスクに存在しませんでした。');
      }
    }

    // 保存ボタンの自動実行
    setTimeout(function() {
      if ($submitBtn.length > 0) {
        console.log(' -> 登録ボタンを自動クリックして保存します。');
        
        // 登録完了後のiframe遷移をキャッチして次のキューを回すための単発バインド
        $iframe.off('load').on('load', function() {
          setTimeout(function() {
            _this.executeNextQueue();
          }, 500);
        });

        $submitBtn.trigger('click');
      } else {
        // ボタンがなかった場合は安全のため離脱して次へ
        _this.executeNextQueue();
      }
    }, 400);
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