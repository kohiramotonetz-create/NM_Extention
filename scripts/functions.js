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
    const $inputField = $('textarea[name="select_cd"]');
    const $targetCell = $('td[colspan="175"]');
    
    if ($inputField.length === 0 || $targetCell.length === 0) return;

    // システムのCSS（.FlexTextarea2__textarea）に合わせたデザイン設計
    const $select = $('<select>', {
      id: 'custom-code-list',
      css: {
        'padding': '4px 8px',
        'margin-left': '15px',
        'font-family': '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
        'font-size': '0.8rem',           // システムの文字サイズと同化
        'line-height': '1.8',
        'color': 'inherit',
        'border': '1px solid #b6c3c6',   // システムと全く同じ枠線の色に変更
        'border-radius': '4px',          // システムと同じ角丸
        'background-color': '#ffffff',
        'vertical-align': 'middle',
        'cursor': 'pointer',
        'transition': 'box-shadow 0.2s ease' // フォーカス時のアニメーション
      }
    });

    // フォーカスしたときにシステム同様に綺麗に光るエフェクトを追加
    $select.on('focus', function() {
      $(this).css('box-shadow', '0 0 0 4px rgba(35, 167, 195, 0.3)');
      $(this).css('outline', '0');
    }).on('blur', function() {
      $(this).css('box-shadow', 'none');
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
