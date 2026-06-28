console.log('functions.js imported.');

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
  if (!endpoint) return null;
  try {
    const response = await $.post(endpoint, body);
    return typeof response === 'string' ? JSON.parse(response) : response;
  } catch (error) {
    console.error('Fetch Error', error);
  }
};

FUNCTION.pagename = {
  appendButton: function () {
    const endpoint = '送信先URL';
    const body = {};
    $('button', { text: '送信ボタン', on: { click: postData(endpoint, body) } }).appendTo('body');
  },
};

// --- yotei2（予定画面） ---
FUNCTION.yotei2_codelist = {
  appendDropdown: function() {
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    if ($inputField.length === 0 || $targetCell.length === 0) return;

    const $select = $('<select>', { id: 'custom-code-list', css: FUNCTION.styles.systemButton });
    $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
    $select.append($('<option>', { value: '000360,000161,000325,000015,000387,000249', text: '専門部会' }));

    $select.on('change', function() {
      const selectedCodes = $(this).val();
      if (selectedCodes) {
        $inputField.val(selectedCodes).trigger('change');
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
    'non-受験生': ['小１', '小２', '小３', '小４', '小５', '小５', '小６', '一貫中１', '一貫中２', '一貫中３', '中１', '中２', '高１', '高２'],
    '受験生': ['受験小１', '受験小２', '受験小３', '受験小４', '受験小５', '受験小６', '中３', '高３', '大学受験']
  },
  appendFilterDropdown: function() {
    if ($('#custom-gakunen-group-filter').length > 0) return;
    const $btn = $('input[value="複数生徒番号指定画面"]');
    if ($btn.length === 0) return;
    const $targetCheckbox = $btn.nextAll('label[for="row_vl"]').first();
    if ($targetCheckbox.length === 0) return;

    const $groupSelect = $('<select>', { id: 'custom-gakunen-group-filter', css: FUNCTION.styles.systemButton });
    $groupSelect.append($('<option>', { value: 'all', text: '-- 学年一括フィルター --' }));
    $groupSelect.append($('<option>', { value: 'non-受験生', text: '非受験生 (小１～小６/一貫中１～３/中１～２/高１～２)' }));
    $groupSelect.append($('<option>', { value: '受験生', text: '受験生 (受験小/中３/高３/大受)' }));

    $groupSelect.on('change', function() {
      const selectedGroup = $(this).val();
      const $bodyFrame = $(parent.document).find('frame[name="student_list_body"]').contents();
      let gakunenIndex = -1;
      $bodyFrame.find('table.small thead tr td').each(function(index) {
        if ($.trim($(this).text()) === '学年') { gakunenIndex = index; return false; }
      });
      if (gakunenIndex === -1) return;
      const $rows = $bodyFrame.find('table.small tbody tr[id^="td"]');
      if (selectedGroup === 'all') {
        $rows.show();
      } else {
        const allowedGakunen = FUNCTION.studentList_filter.groups[selectedGroup];
        $rows.each(function() {
          const $row = $(this);
          const rowGakunen = $.trim($row.find('td').eq(gakunenIndex).text());
          if (allowedGakunen.includes(rowGakunen)) { $row.show(); } else { $row.hide(); }
        });
      }
    });
    $('input[name="b_submit"], input[name="b_submit2"]').on('click', function() { $groupSelect.val('all'); });
    $targetCheckbox.after($groupSelect).after(' ');
  }
};

// --- 担当校舎・高松Ｕカスタム ---
FUNCTION.takamatsuCustom = {
  init: function() {
    $('select[name="tenpo_cd"], select[name="shop_cd"], select[name="tenpo"], select[name="main_tenpo_cd"]').each(function() {
      const $select = $(this);
      if ($select.find('option[value="m"]').length > 0) { $select.val('m'); } 
      else { if ($select.find('option[value="b3701"]').length > 0) { $select.val('b3701'); } }
    });
  }
};

// ===================================================
// TODOリストカスタム（API完全不使用・人間操作エミュレート版）
// ===================================================
FUNCTION.todoList_custom = {
  checkedIds: [],

  // 【API不使用自動化の核心】
  // 新しいタブを一切開かず、一覧画面の「修正」ボタンを順にエミュレートクリックして処理する関数
  _executeActionSequential: function(action, extraParam) {
    const _this = this;
    if (_this.checkedIds.length === 0) return;

    // 選択されたタスクIDの配列をコピーしてキュー（処理待ち行列）を作成
    const queue = [..._this.checkedIds];
    console.log(`[フロント自動操作開始] モード: ${action}, 対象: ${extraParam}, キュー件数: ${queue.length}`);

    // システム（最上位の親階層）のalertを完全に無効化するセーフティをここに配置
    // これにより「登録しました」のアラートで画面が静止するのを100%防止します
    if (window.top) {
      window.top.alert = function(msg) {
        console.log(`[最上位アラート抑止] システムのメッセージを自動パスしました: ${msg}`);
        return true;
      };
    }
    window.alert = function(msg) { return true; };

    // 1件ずつ順番に処理する再帰関数
    function processNext() {
      if (queue.length === 0) {
        console.log("[フロント自動操作完了] すべてのタスクの一括処理が終了しました。一覧を更新します。");
        // すべての処理が終わったら、一覧画面本来のリロード関数を実行して画面を最新状態にする
        if (typeof formreload === "function") {
          formreload();
        } else {
          window.location.reload();
        }
        return;
      }

      const currentTaskId = queue.shift();
      const $row = $(`#td${currentTaskId}`);
      if ($row.length === 0) {
        processNext(); // 行が見つからなければ次へ
        return;
      }

      // 1. 対象タスク行の「修正」ボタンを探してクリック
      const $editBtn = $row.find('input[name="b_edit"], input[value="修正"]');
      if ($editBtn.length === 0) {
        console.warn(`タスクID: ${currentTaskId} の修正ボタンが見つかりません。`);
        processNext();
        return;
      }

      console.log(`-> タスクID: ${currentTaskId} の修正画面を展開します。`);
      $editBtn.trigger('click');

      // 2. 修正画面のフレーム（通常、同じウィンドウ内の別フレームや専用領域）が切り替わるのを少し待つ
      setTimeout(() => {
        // システムの構造（別フレームまたは同一ドキュメント内）から入力エレメントを捕捉
        // どんな画面構造でも届くよう、自画面および親ウィンドウ経由でターゲットを全走査
        let $context = $(document);
        if (window.parent) $context = $(window.parent.document);
        if (window.top) $context = $(window.top.document);

        const $submitBtn = $context.find('#b_submit, input[name="b_submit"]');

        // アクションに応じた値の書き換えを実行
        if (action === "change_status") {
          const $select = $context.find('select[name="jyotai_cb"]');
          if ($select.length > 0) {
            $select.val(extraParam).trigger('change');
            console.log(`   状態を [${extraParam}] に変更しました。`);
          }
        } else if (action === "change_progress") {
          const $input = $context.find('input[name="progress_vl"], #progress_vl');
          if ($input.length > 0) {
            $input.val(extraParam).trigger('change');
            console.log(`   進捗度を [${extraParam}%] に変更しました。`);
          }
        } else if (action === "delete_tanto") {
          const targetClean = extraParam.replace(/[\s\u3000]/g, '');
          $context.find('.tanto_delete').parent().each(function() {
            const currentNameText = $(this).text().replace(/×/g, '').replace(/[\s\u3000]/g, '');
            if (currentNameText === targetClean || currentNameText.includes(targetClean)) {
              const $delSpan = $(this).find('.tanto_delete');
              if ($delSpan.length > 0) {
                $delSpan.trigger('click');
                console.log(`   担当者 [${extraParam}] の×ボタンをクリックしました。`);
              }
            }
          });
        }

        // 3. 値の書き換え完了後、登録ボタンを自動クリック
        if ($submitBtn.length > 0) {
          console.log("   登録ボタンを自動実行します。");
          $submitBtn.trigger('click');
        }

        // 4. 保存が完了してデータが確定するのを少し待ってから、次のタスクの処理へ進む（ループ）
        setTimeout(() => {
          processNext();
        }, 600); // サーバーの保存応答を待つための安全なウェイト時間

      }, 500); // 修正画面がロードされるのを待つウェイト時間
    }

    // 順番処理をキック
    processNext();

    // 選択状態のクリア
    _this.checkedIds = [];
    $('.custom-todo-selector').prop('checked', false);
  },

  appendCheckboxColumn: function() {
    const _this = this;
    const $table = $('table.tbl');
    if ($table.length === 0) return;

    _this.checkedIds = [];

    if ($table.find('tbody tr').first().find('.custom-header-cell').length === 0) {
      $table.find('tbody tr').first().append($('<td>', { text: '選択', class: 'custom-header-cell', style: 'font-weight:bold; text-align:center;' }));
    }

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

    $table.find('tbody tr[id^="tr-todo"]').each(function() {
      const $td = $(this).find('td[colspan="10"]');
      if ($td.length > 0) $td.attr('colspan', '11');
    });

    if ($('#custom-menu-css').length === 0) {
      $('<style>', {
        id: 'custom-menu-css',
        text: `
          .custom-menu-item { position: relative; padding: 8px 14px; cursor: pointer; color: #333333; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center; }
          .custom-menu-item:hover { background-color: #f0f4f9; }
          .custom-child-menu { display: none; position: absolute; left: 100%; top: 0; background-color: #ffffff; border: 1px solid #cccccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 6px 0; min-width: 170px; z-index: 100000; }
          .custom-menu-item:hover > .custom-child-menu { display: block; }
          .custom-child-item { padding: 6px 14px; cursor: pointer; color: #333333; transition: background 0.2s; white-space: nowrap; }
          .custom-child-item:hover { background-color: #e2eaf4; color: #000000; }
        `
      }).appendTo('head');
    }

    $table.on('contextmenu', function(e) {
      if (_this.checkedIds.length > 0) {
        e.preventDefault(); 
        $('#custom-context-menu').remove();

        const $menu = $('<div>', {
          id: 'custom-context-menu',
          css: {
            'position': 'absolute', 'top': e.pageY + 'px', 'left': e.pageX + 'px',
            'background-color': '#ffffff', 'border': '1px solid #cccccc', 'border-radius': '6px',
            'box-shadow': '0 4px 12px rgba(0,0,0,0.15)', 'padding': '6px 0', 'z-index': '99999',
            'min-width': '180px', 'font-family': '"Helvetica Neue", Arial, sans-serif', 'font-size': '10pt'
          }
        });

        // 1. 担当者削除親メニュー
        const $tantoParent = $('<div>', { class: 'custom-menu-item', html: '<span>👤 担当者削除</span><span>▶</span>' });
        const $tantoChildContainer = $('<div>', { class: 'custom-child-menu' });
        ['平本 晃大', '古川 泰治'].forEach(name => {
          $('<div>', { class: 'custom-child-item', text: name }).on('click', function() {
            _this._executeActionSequential("delete_tanto", name);
            $('#custom-context-menu').remove();
          }).appendTo($tantoChildContainer);
        });
        $tantoParent.append($tantoChildContainer).appendTo($menu);

        // 2. 状態変更親メニュー
        const $statusParent = $('<div>', { class: 'custom-menu-item', html: '<span>⚙️ 状態変更</span><span>▶</span>' });
        const $statusChildContainer = $('<div>', { class: 'custom-child-menu' });
        const statuses = [
          { label: '未確認', value: '0' }, { label: '未着手', value: 'A' },
          { label: '作業中', value: 'D' }, { label: '完了', value: 'F' },
          { label: '中断中', value: 'P' }, { label: '中止', value: 'C' }, { label: '削除', value: 'X' }
        ];
        statuses.forEach(st => {
          $('<div>', { class: 'custom-child-item', text: `・ ${st.label}` }).on('click', function() {
            _this._executeActionSequential("change_status", st.value);
            $('#custom-context-menu').remove();
          }).appendTo($statusChildContainer);
        });
        $statusParent.append($statusChildContainer).appendTo($menu);

        // 3. 進捗率変更親メニュー
        const $progressParent = $('<div>', { class: 'custom-menu-item', html: '<span>📈 進捗率変更</span><span>▶</span>' });
        const $progressChildContainer = $('<div>', { class: 'custom-child-menu' });
        $('<div>', { class: 'custom-child-item', text: '100% (完了状態)' }).on('click', function() {
          _this._executeActionSequential("change_progress", "100");
          $('#custom-context-menu').remove();
        }).appendTo($progressChildContainer);
        $progressParent.append($progressChildContainer).appendTo($menu);

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
  }
};

// 互換保持用の空定義
FUNCTION.todoInput_custom = { executeAutomation: function() {} };