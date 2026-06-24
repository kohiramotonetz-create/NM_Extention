$(function () {
  console.log('pageScripts.js is Running.');

  // 以下のコードは該当ドメイン以外却下
  if (
    document.domain != 'menu.edu-netz.com' &&
    document.domain != 'menu2.edu-netz.com'
  )
    return;

  // ページ別関数
  switch (location.pathname) {
    // ------------ NMのレイアウト崩れの修正 ------------
    case '/netz/netz1/tehai/shido2_input_sp.aspx':
      //初回手配画面のレイアウトが崩れているので修正
      $('frameset').attr('rows', '136,*');
      break;
    case '/netz/netz1/s/teian_list.aspx':
      //ヘッド画面が微妙に小さい、、、
      $('frameset').attr('rows', '165,*');
      break;
    case '/netz/netz1/t/teacher_toroku_list.aspx':
      //なぜかスクロール禁止なので許可
      $('frame[name=teacher_toroku_list_head]')
        .removeAttr('scrolling')
        .removeAttr('noresize');
      break;
    case '/toiawase_list.aspx':
      //なぜかスクロール禁止なので許可
      $('frame[name=teacher_toroku_list_head]')
        .removeAttr('scrolling')
        .removeAttr('noresize');
      break;
    case '/netz/netz1/schedule/yotei2.aspx':
      console.log('yotei2_Running');
      // 子コンポーネントを実行（内部で td[colspan="175"] を探して自動で埋め込みます）
      FUNCTION.yotei2_codelist.appendDropdown();
      break;
    // ------------ 生徒一覧・各画面のヘッダー（共通でカスタムを動作させたい画面） ------------
    case '/netz/netz1/student_list_head.aspx': // 生徒一覧ヘッド画面
      console.log('student_list_head_Running');
      // 学年グループフィルターを設置（生徒一覧画面のみの専用処理）
      FUNCTION.studentList_filter.appendFilterDropdown();

      // breakを書かないことで、生徒一覧のときもそのまま自動的に下のカスタム共通処理へと流れます。

    case '/netz/netz1/kouza_enshu_list.aspx':     // 日程選択型講座一覧画面
    case '/netz/netz1/toiawase_list_head.aspx':  // 問合せ一覧のヘッダーフレーム
    case '/netz/netz1/k/keiyaku_list_head.aspx':  // 契約一覧のヘッダーフレーム
    case '/netz/netz1/t/teacher_list_head.aspx':  // 講師一覧のヘッダーフレーム
      console.log('takamatsuCustom_Running_at: ' + location.pathname);
      // 【共通処理】ページに合わせたデフォルト表示を実行
      FUNCTION.takamatsuCustom.init();
      break;

    
    // ------------ ページ別機能の実装 ------------

    case 'どこかのURL':
      // ２通りの考え方がある

      // １．ここにボタンを作って、別ページの関数を発火させる
      // 　メリット：関数＝機能として呼び出す　いろんなページで使い回せる
      // 　デメリット：pageScript.jsがどんどん複雑に（見にくく、メンテナンスしにくく）なっていく
      const endpoint = '送信先URL';
      const body = {}; // 送信データ

      $('button', {
        text: '送信ボタン',
        on: {
          click: FUNCTION.postData(endpoint, body),
        },
      }).appendTo('body');

      // ２．ボタンを作る関数毎
      // 　メリット：機能が増えてもpageScript.jsは見やすい（pageScript.jsはあくまで機能を整理するもの）
      // 　デメリット：基本的にはページごとに使い回せない（機能は同じでも、追加のルールが違ったりする）
      // 　　　　　　　要は、機能とデザインを分離できない
      // 　　　　　　　でも、さらにファイルを１つ増やせば可能なので俺はこっち

      FUNCTION.pagename.appendButton();
      break;
  }
});
