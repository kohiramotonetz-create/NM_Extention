console.log('functions.js imported.');

const FUNCTION = {};

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
    const body = {}; // 送信データ
    $('button', {
      text: '送信ボタン',
      on: {
        click: postData(endpoint, body),
      },
    }).appendTo('body');
  },
};

// --- yotei2（予定画面）用のカスタムコンポーネント ---
FUNCTION.yotei2_codelist = {
  /**
   * 専門部会のリスト（セレクトボックス）を生成して画面に配置する
   */
  appendDropdown: function() {
    // 1. コード指定の枠（textarea）と、配置先となる親のセル（td）を取得
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    
    // 安全策：どちらかの要素が画面に存在しなければ処理をスキップ
    if ($inputField.length === 0 || $targetCell.length === 0) return;

    // 2. セレクトボックス（<select>）要素を生成
    const $select = $('<select>', {
      id: 'custom-code-list',
      css: {
        'padding': '3px',
        'margin-left': '15px',      // オレンジのインプットから少し離す
        'font-size': '12px',
        'border': '2px solid #ff6600', // わかりやすいように枠線をオレンジに
        'border-radius': '4px',
        'vertical-align': 'middle',
        'cursor': 'pointer'
      }
    });

    // 3. 選択肢（<option>）を追加
    $select.append($('<option>', { value: '', text: '-- 専門コード一括入力 --' }));
    $select.append($('<option>', {
      value: '000360,000161,000325,000015,000387,000249', // カンマ区切りのコード
      text: '専門部会'
    }));

    // 4. リストが選ばれた時の自動入力挙動を設定
    $select.on('change', function() {
      const selectedCodes = $(this).val();
      if (selectedCodes) {
        $inputField.val(selectedCodes);
        $inputField.trigger('change'); // システム側の既存スクリプトへの変更通知
      } else {
        $inputField.val('');
      }
    });

    // 5. セル（td）の中の一番最後に追加して画面に表示させる
    $targetCell.append($select);
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
