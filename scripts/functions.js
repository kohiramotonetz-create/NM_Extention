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
      css: FUNCTION.styles.systemButton ,// ★共通管理から読み込み
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
    // 1. システム側の要素を取得
    const $gakunenSelect = $('select[name="gakunen_cb"]');
    const $targetButton = $('input[value="複数生徒番号指定画面"]');
    const $searchForm = $('form').first();

    const $shokiSelect = $('select[name="shoki_disp_cb"], select[name="initial_disp_cb"], select').filter(function() {
      return $(this).text().indexOf('メール・アプリ送信') !== -1;
    }).first();

    if ($gakunenSelect.length === 0 || $targetButton.length === 0 || $searchForm.length === 0) return;
    if ($('#custom-gakunen-group').length > 0) return;

    // 2. セレクトボックス要素を生成（共通デザインを同期）
    const $select = $('<select>', {
      id: 'custom-gakunen-group',
      css: FUNCTION.styles.systemButton
    });

    $select.append($('<option>', { value: '', text: '-- 学年一括選択 --' }));
    $select.append($('<option>', { value: '10,21,22,31,32', text: '非受験生' }));
    $select.append($('<option>', { value: '23,33,38', text: '受験生' }));

    // 3. リスト変更時の連動挙動（美しいテーブルの合体・描画ロジック）
    $select.on('change', async function() {
      const groupValue = $(this).val();
      if (!groupValue) return;

      const codesToSelect = groupValue.split(',');
      const bodyWindow = parent.student_list_body;
      if (!bodyWindow) {
        alert("結果表示画面（フレーム）が見つかりません。");
        return;
      }

      // ローディング表示
      $(bodyWindow.document.body).html('<div style="padding:20px; font-size:14px; color:#666;">学年グループデータを一括取得中... お待ちください...</div>');

      let combinedRows = [];
      let tableHeader = '';
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
          const responseHtml = await $.post($searchForm.attr('action') || location.href, postData);
          const $responseDoc = $(responseHtml);
          const $rows = $responseDoc.find('table tr'); 

          $rows.each(function(index) {
            if (index === 0 && !tableHeader) {
              tableHeader = $(this).prop('outerHTML');
            } else if (index > 0) {
              combinedRows.push($(this).prop('outerHTML'));
            }
          });
        } catch (error) {
          console.error(`学年コード ${code} の取得に失敗しました:`, error);
        }
      }

      // 4. 描画処理（完璧だった黒線テーブルレイアウトを再現）
      if (combinedRows.length > 0) {
        // 黒枠線を明示的に指定したカスタムテーブルHTML
        const newTableHtml = `
          <table border="1" cellpadding="3" cellspacing="0" bordercolor="#111111" style="width:100%; border-collapse:collapse; font-size:9pt; color:#111111;">
            ${tableHeader}
            ${combinedRows.join('')}
          </table>
        `;

        // 凡例テキスト
        let footerHtml = `
          <hr style="border:0; border-top:1px solid #999; margin:15px 0 10px 0;">
          <div class="small">兄：兄弟有無 ◎：１人目 ●：２人目以降 ※赤字：稼働中生徒が２人以上</div>
          <div id="custom-action-buttons" style="margin-top:10px;"></div>
        `;

        // テーブルと凡例を流し込む
        $(bodyWindow.document.body).html(newTableHtml + footerHtml);

        // 「初期表示」が『メール・アプリ送信』の場合、ハリボテボタン一式を配置
        if ($shokiSelect.val() === "メール・アプリ送信" || $shokiSelect.find('option:selected').text().indexOf('メール・アプリ送信') !== -1) {
          // 1. メールボタンを生成
          const $btnMail = $('<input>', {
            type: 'button',
            value: 'メール作成画面を開く',
            css: FUNCTION.styles.systemButton
          });

          // 2. トークボタンを生成（競合を防ぐため別々で完結させます）
          const $btnTalk = $('<input>', {
            type: 'button',
            value: 'トーク一斉発信(生徒)',
            css: FUNCTION.styles.systemButton
          });

          // 3. 【修正確定】安全に横並びの余白（マージン）をあける
          $btnTalk.css('margin-left', '10px');

          // ボタンを配置
          $(bodyWindow.document).find('#custom-action-buttons').append($btnMail).append($btnTalk);
        }
      } else {
        $(bodyWindow.document.body).html('<div style="padding:20px; font-size:14px; color:red;">該当する生徒が見つかりませんでした。</div>');
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