/*
  실제 앨범 이미지와 뮤직비디오를 바꿀 때 이 파일만 수정해도 됩니다.
  cover: 앨범 이미지 경로
  video: mp4 파일 경로 또는 유튜브가 아닌 직접 재생 가능한 영상 URL
*/
window.REGION_LIBRARY = [
  {
    id: "north-korea",
    name: "북한",
    shortLabel: "북한",
    theme: "독립운동가의 기억",
    description: "북한 지역과 연결된 독립운동가의 이야기를 청소년의 음악과 영상으로 만나보세요.",
    videos: [
      {
        id: "north-korea-01",
        title: "김구 독립운동가 이야기",
        activist: "김구",
        cover: "assets/covers/north-korea.png",
        video: "assets/videos/north-korea.mp4",
      },
    ],
  },
  {
    id: "seoul-gyeonggi",
    name: "서울·경기",
    shortLabel: "서울·경기",
    theme: "도시 위에 이어진 역사",
    description: "서울과 경기 지역의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "seoul-gyeonggi-01",
        title: "유관순 독립운동가 이야기",
        activist: "유관순",
        cover: "assets/covers/seoul-gyeonggi.png",
        video: "assets/videos/seoul-gyeonggi.mp4",
      },
    ],
  },
  {
    id: "gangwon",
    name: "강원도",
    shortLabel: "강원도",
    theme: "산과 바람이 전하는 이야기",
    description: "강원도 지역의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "gangwon-01",
        title: "유인석 독립운동가 이야기",
        activist: "유인석",
        cover: "assets/covers/gangwon.png",
        video: "assets/videos/gangwon.mp4",
      },
    ],
  },
  {
    id: "chungcheong",
    name: "충청도",
    shortLabel: "충청도",
    theme: "굳은 마음으로 지킨 나라",
    description: "충청도 지역의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "chungcheong-01",
        title: "윤봉길 독립운동가 이야기",
        activist: "윤봉길",
        cover: "assets/covers/chungcheong.png",
        video: "assets/videos/chungcheong.mp4",
      },
    ],
  },
  {
    id: "jeolla",
    name: "전라도",
    shortLabel: "전라도",
    theme: "들녘에 남은 독립의 노래",
    description: "전라도 지역의 독립운동가 이야기를 담은 뮤직비디오입니다.",
    videos: [
      {
        id: "jeolla-01",
        title: "백정기 독립운동가 이야기",
        activist: "백정기",
        cover: "assets/covers/jeolla.png",
        video: "assets/videos/jeolla.mp4",
      },
    ],
  },
  {
    id: "gyeongsang",
    name: "경상도",
    shortLabel: "경상도",
    theme: "두 개의 노래로 만나는 경상도",
    description: "대표 앨범을 누르면 경상도 독립운동가 뮤직비디오 2편을 선택할 수 있습니다.",
    videos: [
      {
        id: "gyeongsang-01",
        title: "성세빈 독립운동가 이야기",
        activist: "성세빈",
        cover: "assets/covers/gyeongsang-1.png",
        video: "assets/videos/gyeongsang-1.mp4",
      },
      {
        id: "gyeongsang-02",
        title: "박상진 독립운동가 이야기",
        activist: "박상진",
        cover: "assets/covers/gyeongsang-2.png",
        video: "assets/videos/gyeongsang-2.mp4",
      },
    ],
  },
];

/*
  지도 아래에 표시되는 '독립 이후의 노래' 앨범입니다.
  새 노래를 추가할 때는 videos 배열 안에 같은 형식으로 항목을 추가하고,
  index.html의 after-album-card를 복사해 data-after-video 값만 영상 id에 맞춰주세요.
*/
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
      activist: "독립 이후의 노래",
      cover: "assets/covers/haeil.png",
      video: "assets/videos/haeil.mp4",
    },
  ],
};

