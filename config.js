/*
  815Hz 프로젝트 설정 파일

  1) Supabase Project URL과 Publishable key(또는 기존 Anon key)를 입력하세요.
  2) service_role/secret key는 절대로 이 파일에 넣지 마세요.
  3) 두 항목을 비워두면 관람 페이지는 미리보기 모드로 작동하지만,
     댓글은 현재 브라우저에만 저장되고 관리자 페이지는 사용할 수 없습니다.
*/
window.APP_CONFIG = {
  supabaseUrl: "https://txxwjvdssffdyjjvmxre.supabase.co",
  supabaseAnonKey: "sb_publishable_R0cZbSmeGg7zH69Hp-lY5Q_dhA98pzk",
  projectTitle: "815Hz 프로젝트: 재생 중",
  commentsEnabled: true,
  realtimeComments: true,
  maxCommentLength: 300,
};
