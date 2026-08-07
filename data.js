/*
  815Hz 영상 링크 설정

  모든 유튜브 영상은 아래 YOUTUBE_LINKS의 주소를 바꾸면 교체할 수 있습니다.
  링크를 수정한 뒤 data.js와 index.html을 함께 GitHub에 덮어쓰세요.
*/
const YOUTUBE_LINKS = {
  chungcheong: "https://youtu.be/KwzepKa0pQk", // 변경 가능
  gangwon: "https://youtu.be/uD0eMdnngLw", // 변경 가능
  gyeongsang1: "https://youtu.be/gILSVYlGFRI", // 변경 가능
  gyeongsang2: "https://youtu.be/rz9tUk1KTws", // 변경 가능
  jeolla: "https://youtu.be/BbmUY3g-3pU", // 변경 가능
  northKorea: "https://youtu.be/QV_agrIPdaQ", // 변경 가능
  seoulGyeonggi: "https://youtu.be/Z_9Sk-e4niQ", // 변경 가능
  afterIndependence: "https://youtu.be/dVe1TYeQm5w", // 변경 가능
};

window.REGION_LIBRARY = [
  {
    id: "north-korea",
    name: "황해도",
    shortLabel: "황해도 해주",
    theme: "독립운동가의 기억",
    description: "황해도 해주 출생의 독립운동가의 이야기를 청소년의 음악과 영상으로 만나보세요.",
    videos: [
      {
        id: "north-korea-01",
        title: "백범 김구 독립운동가 이야기",
        activist: "백범 김구",
        cover: "assets/covers/north-korea.png",
        youtube: YOUTUBE_LINKS.northKorea,
      },
    ],
  },
  {
    id: "seoul-gyeonggi",
    name: "서울·경기",
    shortLabel: "서울·경기",
    theme: "열일곱, 서울에서 만세를 외치다",
    description: "충남 천안 출생인 유관순 열사의 서울 이화학당 시절과 3·1운동 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "seoul-gyeonggi-01",
        title: "유관순 독립운동가 이야기",
        activist: "유관순",
        cover: "assets/covers/seoul-gyeonggi.png",
        youtube: YOUTUBE_LINKS.seoulGyeonggi,
      },
    ],
  },
  {
    id: "gangwon",
    name: "강원도",
    shortLabel: "강원도",
    theme: "나라를 위해 일어선 의병장",
    description: "강원도 춘천 출생의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "gangwon-01",
        title: "유인석 독립운동가 이야기",
        activist: "유인석",
        cover: "assets/covers/gangwon.png",
        youtube: YOUTUBE_LINKS.gangwon,
      },
    ],
  },
  {
    id: "chungcheong",
    name: "충청도",
    shortLabel: "충청도",
    theme: "굳은 마음으로 지킨 나라",
    description: "충청도 예산 출생의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "chungcheong-01",
        title: "윤봉길 독립운동가 이야기",
        activist: "윤봉길",
        cover: "assets/covers/chungcheong.png",
        youtube: YOUTUBE_LINKS.chungcheong,
      },
    ],
  },
  {
    id: "jeolla",
    name: "전라도",
    shortLabel: "전라도",
    theme: "자유와 독립을 향한 결의",
    description: "전라도 부안 출생의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "jeolla-01",
        title: "백정기 독립운동가 이야기",
        activist: "백정기",
        cover: "assets/covers/jeolla.png",
        youtube: YOUTUBE_LINKS.jeolla,
      },
    ],
  },
  {
    id: "gyeongsang",
    name: "경상도",
    shortLabel: "경상도(울산)",
    theme: "두 개의 노래로 만나는 경상도",
    description: "대표 앨범을 누르면 경상도 독립운동가 뮤직비디오 2편을 선택할 수 있습니다.",
    videos: [
      {
        id: "gyeongsang-01",
        title: "성세빈 독립운동가 이야기",
        activist: "성세빈(울산 동구)",
        cover: "assets/covers/gyeongsang-1.png",
        youtube: YOUTUBE_LINKS.gyeongsang1,
      },
      {
        id: "gyeongsang-02",
        title: "박상진 독립운동가 이야기",
        activist: "박상진(울산 북구)",
        cover: "assets/covers/gyeongsang-2.png",
        youtube: YOUTUBE_LINKS.gyeongsang2,
      },
    ],
  },
];

window.AFTER_INDEPENDENCE_LIBRARY = {
  id: "after-independence",
  name: "독립 이후의 노래",
  shortLabel: "독립 이후",
  detailTitle: "독립 이후의 노래",
  theme: "광복 이후, 오늘까지 이어지는 목소리",
  description: "독립 이후의 시대와 오늘을 살아가는 우리의 이야기를 청소년의 음악과 영상으로 이어갑니다.",
  videos: [
    {
      id: "haeil-01",
      title: "해일",
      activist: "방어진고등학교 방송부 BBS",
      cover: "assets/covers/haeil.png",
      youtube: YOUTUBE_LINKS.afterIndependence,
    },
  ],
};
