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

// --- student_list（生徒一覧画面のヘッダーフレーム）用のカスタムコンポーネント ---
FUNCTION.student_list_gakunen = {
  /**
   * 学年の一括選択リスト（セレクトボックス）を生成して画面に配置する
   */
  appendDropdown: function() {
    // 1. システム側の要素を正確に取得
    const $gakunenSelect = $('select[name="gakunen_cb"]');
    const $targetButton = $('input[value="複数生徒番号指定画面"]');
    const $searchForm = $('form').first();

    if ($gakunenSelect.length === 0 || $targetButton.length === 0 || $searchForm.length === 0) return;
    if ($('#custom-gakunen-group').length > 0) return;

    // 2. セレクトボックス要素を生成
    const $select = $('<select>', {
      id: 'custom-gakunen-group',
      css: FUNCTION.styles.systemButton
    });

    $select.append($('<option>', { value: '', text: '-- 学年一括選択 --' }));
    $select.append($('<option>', { value: '10,21,22,31,32', text: '非受験生' }));
    $select.append($('<option>', { value: '23,33,38', text: '受験生' }));

    // 3. リスト変更時の連動挙動（ピュア明細行結合アプローチ）
    $select.on('change', async function() {
      const groupValue = $(this).val();
      if (!groupValue) return;

      const codesToSelect = groupValue.split(',');
      const bodyWindow = parent.student_list_body;
      if (!bodyWindow) {
        alert("結果表示画面（フレーム）が見つかりません。一度『表示』ボタンで通常検索を行ってください。");
        return;
      }

      const bodyDoc = bodyWindow.document;
      
      // 元の画面（結果フレーム側）にある生徒データテーブルを正確に取得
      const $baseTable = $(bodyDoc).find('table').first();
      if ($baseTable.length === 0) {
        alert("ベースとなる生徒一覧テーブルが見つかりません。一度「表示」ボタンで通常検索を行ってください。");
        return;
      }

      // 画面上の既存の明細データ行（2行目以降）を一度きれいに全消去
      // 1行目の見出し（CHチェックボックス等があるヘッダー）だけを残します
      $baseTable.find('tr').not(':first').remove();

      // 現在ヘッダーフォームに入力されている他の検索条件を取得
      const baseFormData = $searchForm.serializeArray();

      // 各学年コードごとに裏側で非同期通信（POST）を実行
      for (const code of codesToSelect) {
        const postData = baseFormData.map(field => {
          if (field.name === 'gakunen_cb') {
            return { name: 'gakunen_cb', value: code };
          }
          return field;
        });

        try {
          // 裏側でPOSTリクエストを送信
          const responseHtml = await $.post($searchForm.attr('action') || location.href, postData);
          
          // 返ってきたHTMLから、フォームの中にあるテーブルのデータ行（tr）だけを特定
          const $incomingRows = $(responseHtml).find('form table tr');

          $incomingRows.each(function(index) {
            // 返ってきたデータの1行目（重複する見出し行）は不要なのでスキップし、
            // 2行目以降の純粋な「生徒データ行」だけを既存のテーブルに安全に追加結合
            if (index > 0) {
              $baseTable.append($(this).prop('outerHTML'));
            }
          });
        } catch (error) {
          console.error(`学年コード ${code} の取得に失敗しました:`, error);
        }
      }

      // 4. 下部凡例とカスタムボタンの制御（既存の純正ボタンを絶対に壊さないように変更）
      const $systemMailBtn = $(bodyDoc).find('input[onclick*="mail_send"]');
      const $systemTalkBtn = $(bodyDoc).find('input[onclick*="multipletalk"]');

      // 以前のカスタムラッパーが残っていればクリア
      $(bodyDoc).find('.custom-legend-text, #custom-action-wrapper').remove();

      if ($systemMailBtn.length > 0) {
        // 1. 純正のグレーのボタンの直前に、指定の凡例テキストを挿入
        $systemMailBtn.first().before('<div class="small custom-legend-text" style="margin-bottom:10px; margin-top:15px;">兄：兄弟有無 ◎：１人目 ●：２人目以降 ※赤字：稼働中生徒が２人以上</div>');
        
        // 2. 純正ボタンを非表示（hide）にする
        $systemMailBtn.hide();
        $systemTalkBtn.hide();

        // 3. 一括管理デザイン（システムボタン）を適用したラッパーと新しいボタンを生成
        const $btnWrapper = $('<div>', { id: 'custom-action-wrapper', css: { 'margin-top': '10px' } });

        $('<input>', {
          type: 'button',
          value: 'メール作成画面を開く',
          css: FUNCTION.styles.systemButton,
          style: 'margin-left: 0px;'
        }).on('click', function() {
          // ★関数を直接呼ばず、HTML内に元から安全にバインドされている純正ボタンを拡張機能が背後からクリック！
          $systemMailBtn.trigger('click'); 
        }).appendTo($btnWrapper);

        if ($systemTalkBtn.length > 0) {
          $('<input>', {
            type: 'button',
            value: 'トーク一斉発信(生徒)',
            css: FUNCTION.styles.systemButton,
            style: 'margin-left: 10px;'
          }).on('click', function() {
            $systemTalkBtn.trigger('click'); // ★裏の純正トークボタンを代わりにクリック！
          }).appendTo($btnWrapper);
        }

        // 新しい美しいボタン一式を表示
        $systemMailBtn.first().before($btnWrapper);
      }

      // 選択状態をリセット
      $(this).val('');
    });

    // 5. 配置処理
    $targetButton.css('vertical-align', 'middle');
    $targetButton.after($select);
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