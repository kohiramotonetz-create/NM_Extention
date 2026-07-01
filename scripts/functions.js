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
// 学年グループフィルター
// ====================================================
FUNCTION.studentList_filter = {
  // 学年マッピング
  groups: {
    'non-受験生': ['小１', '小２', '小３', '小４', '小５', '小６', '一貫中１', '一貫中２', '一貫中３', '中１', '中２', '高１', '高２'],
    '受験生': ['受験小１', '受験小２', '受験小３', '受験小４', '受験小５', '受験小６', '中３', '高３', '大学受験']
  },

  appendFilterDropdown: function() {
    // 既にフィルターが設置されている場合は重複しないようにスキップ
    if ($('#custom-gakunen-group-filter').length > 0) return;

    // 「複数生徒番号指定画面」ボタンを確実にターゲットにする
    const $btn = $('input[value="複数生徒番号指定画面"]');
    if ($btn.length === 0) return;

    // ボタンの隣にあるチェックボックスの「label要素」を特定する
    const $targetCheckbox = $btn.nextAll('label[for="row_vl"]').first();
    if ($targetCheckbox.length === 0) return;

    // クイックフィルター用のセレクトボックスを作成
    const $groupSelect = $('<select>', {
      id: 'custom-gakunen-group-filter',
      css: FUNCTION.styles.systemButton
    });

    // オプションの追加
    $groupSelect.append($('<option>', { value: 'all', text: '-- 学年一括フィルター --' }));
    $groupSelect.append($('<option>', { value: 'non-受験生', text: '非受験生 (小１～小６/一貫中１～３/中１～２/高１～２)' }));
    $groupSelect.append($('<option>', { value: '受験生', text: '受験生 (受験小/中３/高３/大受)' }));

    // フィルター処理のイベントバインド
    $groupSelect.on('change', function() {
      const selectedGroup = $(this).val();
      
      // 廊下（親画面：parent）を経由して、隣の部屋（下の表のフレーム）を覗き込む
      const $bodyFrame = $(parent.document).find('frame[name="student_list_body"]').contents();
      
      // 表の見出し（theadのtr）から「学年」と書かれている列の順番（位置）を自動で探す
      let gakunenIndex = -1;
      $bodyFrame.find('table.small thead tr td').each(function(index) {
        if ($.trim($(this).text()) === '学年') {
          gakunenIndex = index;
          return false; // 見つかったらループを抜ける
        }
      });

      // もし「学年」という見出しが見つからなかった場合は安全のために処理を止める
      if (gakunenIndex === -1) {
        console.log('表の中に「学年」の列が見つかりません。');
        return;
      }

      // 生徒の行（tbodyのtr）をすべて取得
      const $rows = $bodyFrame.find('table.small tbody tr[id^="td"]');

      if (selectedGroup === 'all') {
        // すべて表示
        $rows.show();
      } else {
        const allowedGakunen = FUNCTION.studentList_filter.groups[selectedGroup];
        
        $rows.each(function() {
          const $row = $(this);
          
          // 先ほど自動判定した「学年」の列番目から正確に文字を読み取る
          const rowGakunen = $.trim($row.find('td').eq(gakunenIndex).text());

          // 判定して目隠し（非表示）を切り替える
          if (allowedGakunen.includes(rowGakunen)) {
            $row.show();
          } else {
            $row.hide();
          }
        });
      }
    });

    // 「表示」ボタンが押されて再読み込みされた時にフィルターをリセット
    $('input[name="b_submit"], input[name="b_submit2"]').on('click', function() {
      $groupSelect.val('all');
    });

    // チェックボックスが入っているlabelのすぐ右隣にスペースを挟んで設置
    $targetCheckbox.after($groupSelect).after(' ');
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

      // 完全別タブ（裏画面）として新規展開し、タブ側に処理を投げっぱなす
      window.open(targetUrl, '_blank');
      console.log(' -> 別タブ起動指示: ' + targetUrl);

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
// 汎用テーブルExcel風フィルター機能（複合AND検索対応）
// ====================================================
FUNCTION.tableExcelFilter = {
  /**
   * 指定されたjQueryテーブル要素にフィルター機能を組み込む
   * @param {jQuery} $table - 対象のテーブル要素
   */
  init: function($table) {
    if (!$table || $table.length === 0) return;

    // 1. ヘッダー行の特定 (thead内を最優先、なければtbodyの1行目)
    let $headerRow = $table.find('thead tr').first();
    if ($headerRow.length === 0) {
      $headerRow = $table.find('tbody tr').first();
    }
    if ($headerRow.length === 0) return;

    // 2. データ行（idが"td"で始まるtr）のみを抽出
    const $dataRows = $table.find('tbody tr[id^="td"]');
    if ($dataRows.length === 0) return;

    // フィルター用スタイル設定（既存のsystemButtonをベースにコンパクトに調整）
    const filterStyle = $.extend({}, FUNCTION.styles.systemButton, {
      'display': 'inline-block',
      'width': 'auto',
      'max-width': '100px',
      'font-size': '8pt',
      'height': '18px',
      'padding': '0px 2px',
      'margin-left': '6px',
      'vertical-align': 'middle',
      'font-weight': 'normal'
    });

    // 3. 各ヘッダーセルをスキャンしてセレクトボックスを配置
    $headerRow.find('td, th').each(function(colIndex) {
      const $headerCell = $(this);
      
      // 既にフィルターが設置されている場合は重複防止のためスキップ
      if ($headerCell.find('.custom-table-filter').length > 0) return;

      // この列に存在するデータ行のテキストを一意（Unique）に取得
      const uniqueValues = [];
      $dataRows.each(function() {
        const cellText = $.trim($(this).find('td').eq(colIndex).text());
        // 空文字でなく、まだ配列に存在しない場合は追加
        if (cellText !== '' && $.inArray(cellText, uniqueValues) === -1) {
          uniqueValues.push(cellText);
        }
      });

      // 選択肢が「全て表示」以外に無い、または1つだけの場合はフィルターを生成しない
      if (uniqueValues.length <= 1) return;

      // ユーザーが見やすいように選択肢を昇順ソート
      uniqueValues.sort();

      // セレクトボックスの生成
      const $select = $('<select>', {
        class: 'custom-table-filter',
        css: filterStyle,
        data: { 'col-index': colIndex } // 列番号を保持
      });

      // 初期値（全て表示）を追加
      $select.append($('<option>', { value: '', text: '▼ 全て' }));
      
      // 動的に生成した一意な選択肢を追加
      $.each(uniqueValues, function(index, value) {
        $select.append($('<option>', { value: value, text: value }));
      });

      // ヘッダーのレイアウト崩れを防ぐため、インラインブロック化してセルの末尾に配置
      $headerCell.css('white-space', 'nowrap').append($select);
    });

    // 4. フィルター変更時のイベント処理（デリゲートにより安全にバインド）
    $headerRow.off('change', '.custom-table-filter').on('change', '.custom-table-filter', function() {
      
      // 現在アクティブな（選択されている）フィルター条件をすべて収集
      const activeFilters = [];
      $headerRow.find('.custom-table-filter').each(function() {
        const $currentSelect = $(this);
        const selectedValue = $currentSelect.val();
        if (selectedValue !== '') {
          activeFilters.push({
            colIndex: $currentSelect.data('col-index'),
            value: selectedValue
          });
        }
      });

      // 各データ行を表示するか非表示にするか一括判定 (Excel同等のAND条件)
      $dataRows.each(function() {
        const $row = $(this);
        let isMatch = true;

        // すべてのアクティブなフィルター条件を満たしているかチェック
        $.each(activeFilters, function(i, filter) {
          const rowCellText = $.trim($row.find('td').eq(filter.colIndex).text());
          if (rowCellText !== filter.value) {
            isMatch = false;
            return false; // 一つでも不一致があればループを抜ける (break)
          }
        });

        // 判定結果に基づいて表示を切り替え
        if (isMatch) {
          $row.show();
        } else {
          $row.hide();
        }
      });
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