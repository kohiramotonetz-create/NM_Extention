$(function () {
  console.log('pageScripts.js is Running.');

  if (
    document.domain != 'menu.edu-netz.com' &&
    document.domain != 'menu2.edu-netz.com'
  )
    return;

  switch (location.pathname) {
    // ------------ NMのレイアウト崩れの修正 ------------
    case '/netz/netz1/tehai/shido2_input_sp.aspx':
      $('frameset').attr('rows', '136,*');
      break;
    case '/netz/netz1/s/teian_list.aspx':
      $('frameset').attr('rows', '165,*');
      break;
    case '/netz/netz1/t/teacher_toroku_list.aspx':
      $('frame[name=teacher_toroku_list_head]')
        .removeAttr('scrolling')
        .removeAttr('noresize');
      break;
    case '/toiawase_list.aspx':
      $('frame[name=teacher_toroku_list_head]')
        .removeAttr('scrolling')
        .removeAttr('noresize');
      break;
    case '/netz/netz1/schedule/yotei2.aspx':
      console.log('yotei2_Running');
      FUNCTION.yotei2_codelist.appendDropdown();
      break;

    // =================================================================
    // パターンA: 【フレーム分離型画面】（生徒一覧・契約一覧・売上情報・入金情報など）
    // =================================================================
    // ★売上情報と入金情報の両方を、階層・フォルダ不問で強制キャッチできるように条件式を拡張します
    case (location.pathname.indexOf('uriage_list_head.aspx') !== -1 ? location.pathname : ''): // 売上情報
    case (location.pathname.indexOf('nyukin_list_head.aspx') !== -1 ? location.pathname : ''):  // ★【新設】入金情報を強制キャッチ！
    case '/netz/netz1/kanren/booth_select.aspx':  // ブース選択[cite: 3]
    case '/netz/netz1/t/teacher_list.aspx':       // 講師一覧（別動線）[cite: 3]
    case '/netz/netz1/t/teacher_list_head.aspx':   // 講師情報[cite: 3]
    case '/netz/netz1/student_list_head.aspx':  // 生徒一覧[cite: 3]
    case '/netz/netz1/toiawase_list_head.aspx':  // 問合せ情報[cite: 3]
    case '/netz/netz1/k/keiyaku_list_head.aspx':   // 契約一覧[cite: 3]
    case '/netz/netz1/k/kaiyaku_list_head.aspx':   // 解約情報[cite: 3]
    case '/netz/netz1/moshi/moshi_list_head.aspx':  // 模試受験者情報[cite: 3]
      console.log('Frame_Type_Page_Running_at: ' + location.pathname);
      
      // 1. 【生徒一覧専用】学年一括フィルターの設置＆デフォルト検索条件の自動適用
      if (location.pathname === '/netz/netz1/student_list_head.aspx') {
        // ★追加：並び順を「教室→生徒名」(value="3") に自動切り替え
        $('input[name="sort"][value="3"]').prop('checked', true);

        // ★追加：状態を「指導中(長+NALU)」(value="+") に自動切り替え
        $('#jyotai_cb').val('+');

        // ★追加：校舎の自動選択処理などが完了したタイミングを見計らって自動送信（表示ボタン押下）
        setTimeout(function() {
          if (document.form1) {
            document.form1.submit();
          }
        }, 100); // 0.1秒の安全バッファ
      }

      // 2. 自動校舎選択（高松カスタム）を実行
      // これで入金情報画面でも「栗林」や「木太南」が全自動で選択されるようになります！
      FUNCTION.takamatsuCustom.init();

      // 3. 自分（head）と同じ親を持つ「別のデータフレーム（body）」を全自動検出[cite: 3]
      let $targetFrame = $();
      $(parent.document).find('frame, iframe').each(function() {
        if (this.contentWindow !== window) {
          $targetFrame = $(this);
          return false; // break
        }
      });
      
      if ($targetFrame.length > 0) {
        console.log(' -> 下部データフレームを自動検出しました。');

        // 下の部屋（データ側）がロード・更新されたタイミングで実行する共通関数
        const applyFilterToFrame = function() {
          setTimeout(function() {
            // 下の部屋に存在するテーブル要素を直接ターゲットにする
            const $tables = $targetFrame.contents().find('table.small, table.tbl, table');
            
            $tables.each(function() {
              const $table = $(this);
              
              if ($table.find('.filter-wrap, .filter-btn').length > 0) return;
              const $rows = $table.find('tbody tr, tr');
              if ($rows.length <= 1) return;

              // id無名テーブル対策：データ行にカスタムIDを一括自動付与
              let hasValidDataRows = false;
              $rows.each(function(rowIndex) {
                if (rowIndex === 0) return; // 見出しはスキップ
                
                const $row = $(this);
                const rowId = $row.attr('id');
                
                if (rowId && (rowId.indexOf('td') === 0 || rowId.indexOf('tr') === 0)) {
                  hasValidDataRows = true;
                } else if (!rowId && $row.find('td').length > 0) {
                  // 入金合計行（colspanがある行）を安全に除外してデータ明細行のみをマーク
                  if ($row.find('td').first().attr('colspan') === undefined) {
                    const customId = 'custom-td-' + Math.random().toString(36).substring(2, 9);
                    $row.attr('id', customId);
                    hasValidDataRows = true;
                  }
                }
              });

              if (hasValidDataRows) {
                console.log(' -> 下部データテーブルにExcel風フィルターを適用しました。');
                FUNCTION.tableExcelFilter.init($table);
              }
            });
          }, 300);
        };

        // 下の部屋がロードされたら適用
        $targetFrame.off('load.customExcelFilter').on('load.customExcelFilter', applyFilterToFrame);

        // 即時適用セーフティネット
        if ($targetFrame.contents().find('table').length > 0) {
          applyFilterToFrame();
        }
      }
      break;

    // =================================================================
    // パターンB: 【単一画面型】（講座一覧や月謝集計など、画面遷移で直接表が出る構造）
    // =================================================================
    case '/netz/netz1/shingaku/kouza_jyuko_list.aspx':       // 講座受講者・予定混在リスト
    case '/netz/netz1/shingaku/kouza_enshu_jyuko_list.aspx': // 講座受講者
    case '/netz/netz1/shingaku/kouza_enshu_list.aspx':       // 日程選択型講座   
    case '/netz/netz1/shingaku/kouza_list.aspx':            // 日程固定型講座
    case '/netz/netz1/u/gessya_tenpo.aspx':                 // 校舎別月謝集計
    case '/netz/netz1/u/gessya.aspx':                       // 学年別月謝集計
    case '/netz/netz1/kanren/tenpo_shido_kiroku_list.aspx': // 指導報告
      console.log('Direct_Page_ExcelFilter_Running_at: ' + location.pathname);
      
      // 1. 自動校舎選択（高松カスタム）を実行
      FUNCTION.takamatsuCustom.init();

      // 2. 【完全強化版】画面内のすべてのテーブルを走査し、データ行を全自動でマークして適用
      $('table.tbl, table.small, table').each(function() {
        const $table = $(this);
        
        // すでにフィルターボタンが設置されている場合は重複防止のためスキップ
        if ($table.find('.filter-wrap, .filter-btn').length > 0) return;

        // 1行目がヘッダー行（背景色あり等）になっているか確認
        const $rows = $table.find('tbody tr, tr');
        if ($rows.length <= 1) return; // 行数が1行以下のテーブルはスキップ

        // 【新設】もしデータ行に id が付いていないテーブル（テキスト表など）の場合、
        // 2行目以降の通常行に対して自動で一時的なカスタムID（id="custom-td-X"）を付与してデータ行化する
        let hasValidDataRows = false;
        $rows.each(function(rowIndex) {
          if (rowIndex === 0) return; // 1行目（見出し）はスキップ
          
          const $row = $(this);
          const rowId = $row.attr('id');
          
          // すでに正規の id (tdやtr) がある場合はそれを活かす
          if (rowId && (rowId.indexOf('td') === 0 || rowId.indexOf('tr') === 0)) {
            hasValidDataRows = true;
          } 
          // id が無い、かつ非表示の入力用行（hidden）等ではないまともなデータ行であれば、IDを自動付与
          else if (!rowId && $row.find('td').length > 0) {
            const customId = 'custom-td-' + Math.random().toString(36).substring(2, 9);
            $row.attr('id', customId);
            hasValidDataRows = true;
          }
        });

        // データ行がしっかりと構築できたテーブルであれば、個別にフィルター機能を起動
        if (hasValidDataRows) {
          console.log(' -> 対象テーブル（ID自動補正済）にフィルターを適用します。');
          FUNCTION.tableExcelFilter.init($table);
        }
      });
      break;
  
      
    // ------------ TODOリストの一覧画面カスタム ------------
    case '/netz/netz1/todo/todo_list.aspx':
      console.log('todo_list_Running');
      FUNCTION.todoList_custom.appendCheckboxColumn();
      break;   

    // ------------ TODOリストの修正・入力画面（裏画面自動操作用） ------------
    case '/netz/netz1/todo/todo_input.aspx':
      console.log('todo_input_Running');
      FUNCTION.todoInput_custom.executeAutomation();
      break;

    // ------------ ページ別機能の実装 ------------
    case 'どこかのURL':
      const endpoint = '送信先URL';
      const body = {}; 

      $('button', {
        text: '送信ボタン',
        on: {
          click: FUNCTION.postData(endpoint, body),
        },
      }).appendTo('body');

      FUNCTION.pagename.appendButton();
      break;
  }
});