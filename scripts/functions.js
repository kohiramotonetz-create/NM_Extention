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

// --- student_list（生徒一覧画面）用のカスタムコンポーネント ---
FUNCTION.student_list_gakunen = {
  /**
   * 学年の一括選択リスト（セレクトボックス）を生成して画面に配置する
   */
  appendDropdown: function() {
    // 1. システム側の既存の学年セレクトボックスを取得
    const $gakunenSelect = $('select[name="gakunen_cb"]');
    
    // 2. 基準となる「複数生徒番号指定画面」ボタンを取得
    const $targetButton = $('input[value="複数生徒番号指定画面"]');

    // どちらかが画面になければ処理をスキップ
    if ($gakunenSelect.length === 0 || $targetButton.length === 0) return;

    // 重複して何度も生成されるのを防ぐ（安全策）
    if ($('#custom-gakunen-group').length > 0) return;

    // 3. 今回追加するセレクトボックス要素を生成（共通デザインを同期）
    const $select = $('<select>', {
      id: 'custom-gakunen-group',
      css: FUNCTION.styles.systemButton
    });

    // 4. 選択肢（学年グループ）を追加
    $select.append($('<option>', { value: '', text: '-- 学年一括選択 --' }));
    $select.append($('<option>', {
      value: '10,21,22,31,32', // 非受験生
      text: '非受験生'
    }));
    $select.append($('<option>', {
      value: '23,33,38',       // 受験生
      text: '受験生'
    }));

    // 5. リストが変更された時の連動挙動（マルチセレクト対応）
    $select.on('change', function() {
      const groupValue = $(this).val();
      
      // 一旦、既存の学年選択をすべてリセット（初期化）
      $gakunenSelect.val([]);

      if (groupValue) {
        const codesToSelect = groupValue.split(',');
        
        // 【重要】元のセレクトボックスを確実に複数選択（マルチセレクト）状態にする
        $gakunenSelect.val(codesToSelect);
      }
      
      // システムに変更を通知
      $gakunenSelect.trigger('change');
    });

    // 6. 【配置ロジックの抜本的修正】
    // ボタンの周りのレイアウト崩れを防ぐため、ボタンの直後にインライン要素として安全に滑り込ませる
    $targetButton.after($select);
    
    // もし写真にある「目印用のオレンジ枠（元からあるインプット枠）」が画面に居れば隠す
    $('input[style*="69.26"], input[style*="25.6"]').hide();
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