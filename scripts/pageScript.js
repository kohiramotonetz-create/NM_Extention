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
    // ------------ 生徒一覧・各画面のヘッダー ------------
    case '/netz/netz1/student_list_head.aspx': 
      console.log('student_list_head_Running');
      FUNCTION.studentList_filter.appendFilterDropdown();

    case '/netz/netz1/shingaku/kouza_enshu_list.aspx': // 日程選択型講座     
    case '/netz/netz1/shingaku/kouza_list.aspx':  //日程固定型講座
    case '/netz/netz1/toiawase_list_head.aspx':  // 問合せ情報
    case '/netz/netz1/k/keiyaku_list_head.aspx':  // 契約情報
    case '/netz/netz1/t/teacher_list_head.aspx':  // 講師情報
      console.log('takamatsuCustom_Running_at: ' + location.pathname);
      FUNCTION.takamatsuCustom.init();
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