console.log('functions.js imported.');

// 1. すべての基盤となるグローバルオブジェクトの宣言
const FUNCTION = {};

// ==================================================
// ★ デザイン・スタイルの一括管理（一定管理）
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

// 雛形パーツ（今後整理しても良い箇所）
FUNCTION.pagename = {
  appendButton: function () {
    const endpoint = '送信先URL';
    const body = {};
    $('button', {
      text: '送信ボタン',
      on: {
        click: postData(endpoint, body),
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
      css: FUNCTION.styles.systemButton // ★共通管理から読み込み
    });

    // 選択肢の追加
    $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
    $select.append($('<option>', {
      value: '000360,000161,000325,000015,000387,000249',
      text: '専門部会'
    }));

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
    'non-受験生': ['小１', '小２', '小３', '小４', '小５', '小５', '小６', '一貫中１', '一貫中２', '一貫中３', '中１', '中２', '高１', '高２'],
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
// 担当校舎・高松Ｕカスタム（みらいミッテ栗林の紐付けと初期表示制御）
// ====================================================
FUNCTION.takamatsuCustom = {
  init: function() {
    const $select = $('select[name="tenpo_cd"]');
    if ($select.length === 0) return;

    // 1. 「高松Ｕ」のoptgroupを取得して「みらいミッテ栗林」を紐付け
    const $optgroup = $select.find('optgroup[label="高松Ｕ"]');
    if ($optgroup.length > 0) {
      // すでにグループ内に「みらいミッテ栗林(8023)」が存在しないか確認
      if ($optgroup.find('option[value="8023"]').length === 0) {
        // 既存の「みらいミッテ栗林」を取得して、高松Ｕのoptgroupの末尾に移動・紐付け
        const $mitteOption = $select.find('option[value="8023"]').first();
        if ($mitteOption.length > 0) {
          $optgroup.append($mitteOption);
        } else {
          // 万が一既存のoptionが見つからない場合は新規作成して追加
          $optgroup.append($('<option>', { value: '8023', text: 'みらいミッテ栗林' }));
        }
      }
    }

    // 2. ページに応じた初期表示の制御（セーフティネット強化版）
    // セレクトボックスの中に「担当校舎(value="m")」が存在する場合（生徒一覧など）
    if ($select.find('option[value="m"]').length > 0) {
      // まだ何も選択されていない、または初期状態の時に「担当校舎」を選択
      if (!$select.val() || $select.val() === "" || $select.val() === "m") {
        $select.val('m');
      }
    } else {
      // 「担当校舎」という選択肢が無いページ（日程選択型講座など）は、強制的に高松Ｕ（b3701）を設定
      $select.val('b3701');
    }
  }
};

//以下はもう一つ globalFunction.jsとか別ファイルを作ってそっちにいれるほうがいいかな
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