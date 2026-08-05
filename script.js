(() => {
  "use strict";

  const config = window.APP_CONFIG || {};
  const regions = Array.isArray(window.REGION_LIBRARY) ? window.REGION_LIBRARY : [];
  const afterCollection = window.AFTER_INDEPENDENCE_LIBRARY || null;


  const mapImage = document.querySelector(".korea-map-art");
  const mapContainer = document.querySelector(".korea-map-image");
  const mapLoadError = document.getElementById("map-load-error");

  function showMapLoadError() {
    mapContainer?.classList.add("map-failed");
    if (mapLoadError) mapLoadError.hidden = false;
  }

  if (mapImage) {
    mapImage.addEventListener("error", showMapLoadError);
    mapImage.addEventListener("load", () => {
      mapContainer?.classList.remove("map-failed");
      if (mapLoadError) mapLoadError.hidden = true;
    });
    if (mapImage.complete && !mapImage.naturalWidth) showMapLoadError();
  }

  const els = {
    mapRegions: [...document.querySelectorAll(".region[data-region]")],
    mapPlayControls: [...document.querySelectorAll("[data-map-play]")],
    regionTheme: document.getElementById("region-theme"),
    detailTitle: document.getElementById("detail-title"),
    coverImage: document.getElementById("cover-image"),
    albumToggle: document.getElementById("album-toggle"),
    albumActionText: document.getElementById("album-action-text"),
    videoCountBadge: document.getElementById("video-count-badge"),
    videoTitle: document.getElementById("video-title"),
    activistName: document.getElementById("activist-name"),
    regionDescription: document.getElementById("region-description"),
    choiceWrap: document.getElementById("video-choice-wrap"),
    choiceList: document.getElementById("video-choice-list"),
    playButton: document.getElementById("play-button"),
    viewCount: document.getElementById("view-count"),
    commentSection: document.getElementById("comment-section"),
    commentForm: document.getElementById("comment-form"),
    nickname: document.getElementById("nickname"),
    commentText: document.getElementById("comment-text"),
    honeypot: document.getElementById("website"),
    commentCount: document.getElementById("comment-count"),
    commentList: document.getElementById("comment-list"),
    storageNotice: document.getElementById("storage-notice"),
    dialog: document.getElementById("video-dialog"),
    closeDialog: document.getElementById("close-dialog"),
    dialogRegion: document.getElementById("dialog-region"),
    dialogTitle: document.getElementById("dialog-title"),
    videoPlayer: document.getElementById("video-player"),
    youtubePlayer: document.getElementById("youtube-player"),
    youtubeFallbackLink: document.getElementById("youtube-fallback-link"),
    videoError: document.getElementById("video-error"),
    afterAlbumButtons: [...document.querySelectorAll(".after-album-card[data-after-video]")],
  };

  let selectedRegion = regions[1] || regions[0] || afterCollection;
  let selectedVideo = selectedRegion?.videos?.[0] || null;
  let supabaseClient = null;
  let commentChannel = null;
  let lastCommentAt = 0;

  const hasSupabase = Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    window.supabase?.createClient
  );

  if (hasSupabase) {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  function getYouTubeId(url) {
    if (!url || typeof url !== "string") return "";

    try {
      const parsed = new URL(url, window.location.href);
      const host = parsed.hostname.replace(/^www\./, "");

      if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || "";
      if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
        if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || "";
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || "";
      }
    } catch {
      return "";
    }

    return "";
  }

  function buildYouTubeEmbedUrl(url) {
    const id = getYouTubeId(url);
    if (!id) return "";
    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
  }

  function localKey(kind, videoId) {
    return `815hz:${kind}:${videoId}`;
  }

  function getLocalViews(videoId) {
    return Number(localStorage.getItem(localKey("views", videoId)) || 0);
  }

  function setLocalViews(videoId, value) {
    localStorage.setItem(localKey("views", videoId), String(value));
    return value;
  }

  function getLocalComments(videoId) {
    try {
      return JSON.parse(localStorage.getItem(localKey("comments", videoId)) || "[]");
    } catch {
      return [];
    }
  }

  function setLocalComments(videoId, comments) {
    localStorage.setItem(localKey("comments", videoId), JSON.stringify(comments));
  }

  async function fetchViews(videoId) {
    if (!supabaseClient) return getLocalViews(videoId);

    const { data, error } = await supabaseClient
      .from("video_views")
      .select("views")
      .eq("video_id", videoId)
      .maybeSingle();

    if (error) {
      console.warn("조회수를 불러오지 못했습니다.", error.message);
      return 0;
    }
    return Number(data?.views || 0);
  }

  async function incrementViews(videoId) {
    if (!supabaseClient) {
      return setLocalViews(videoId, getLocalViews(videoId) + 1);
    }

    const { data, error } = await supabaseClient.rpc("increment_video_view", {
      p_video_id: videoId,
    });

    if (error) {
      console.warn("조회수를 증가시키지 못했습니다.", error.message);
      return fetchViews(videoId);
    }
    return Number(data || 0);
  }

  async function fetchComments(videoId) {
    if (!supabaseClient) return getLocalComments(videoId);

    const { data, error } = await supabaseClient
      .from("video_comments")
      .select("id, nickname, content, created_at")
      .eq("video_id", videoId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("댓글을 불러오지 못했습니다.", error.message);
      throw new Error("댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
    return data || [];
  }

  async function addComment(videoId, nickname, content) {
    const cleanNickname = nickname.trim().slice(0, 20);
    const cleanContent = content.trim().slice(0, config.maxCommentLength || 300);

    if (!cleanNickname || !cleanContent) {
      throw new Error("이름과 댓글을 모두 입력해주세요.");
    }
    if (els.honeypot?.value) {
      throw new Error("댓글을 등록하지 못했습니다.");
    }
    if (Date.now() - lastCommentAt < 5000) {
      throw new Error("댓글은 5초에 한 번 등록할 수 있습니다.");
    }

    if (!supabaseClient) {
      const comments = getLocalComments(videoId);
      const newComment = {
        id: `local-${Date.now()}`,
        nickname: cleanNickname,
        content: cleanContent,
        created_at: new Date().toISOString(),
      };
      comments.unshift(newComment);
      setLocalComments(videoId, comments.slice(0, 100));
      lastCommentAt = Date.now();
      return newComment;
    }

    const { data, error } = await supabaseClient.rpc("submit_video_comment", {
      p_video_id: videoId,
      p_nickname: cleanNickname,
      p_content: cleanContent,
    });

    if (error) {
      const message = error.message?.includes("COMMENT_RATE_LIMIT")
        ? "댓글을 너무 빠르게 등록하고 있습니다. 잠시 후 다시 시도해주세요."
        : "댓글 등록에 실패했습니다. 입력 내용을 확인해주세요.";
      throw new Error(message);
    }

    lastCommentAt = Date.now();
    return data;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function updateMapActiveState() {
    els.mapRegions.forEach((regionEl) => {
      const active = regionEl.dataset.region === selectedRegion?.id;
      regionEl.classList.toggle("active", active);
      regionEl.setAttribute("aria-pressed", String(active));
    });
  }

  function updateAfterActiveState() {
    els.afterAlbumButtons.forEach((button) => {
      const isActive = selectedRegion?.id === afterCollection?.id && button.dataset.afterVideo === selectedVideo?.id;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setAfterViewCount(videoId, views) {
    const counter = document.getElementById(`after-view-${videoId}`);
    if (counter) counter.textContent = Number(views || 0).toLocaleString("ko-KR");
  }

  async function refreshAfterIndependenceViews() {
    if (!afterCollection?.videos?.length) return;
    await Promise.all(afterCollection.videos.map(async (video) => {
      const views = await fetchViews(video.id);
      setAfterViewCount(video.id, views);
    }));
  }

  function selectAfterVideo(videoId, { playImmediately = false } = {}) {
    if (!afterCollection?.videos?.length) return;
    const found = afterCollection.videos.find((video) => video.id === videoId);
    if (!found) return;

    selectedRegion = afterCollection;
    selectedVideo = found;
    renderSelectedVideo();

    if (playImmediately) openVideo();
  }

  function buildChoiceList() {
    els.choiceList.replaceChildren();

    selectedRegion.videos.forEach((video) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `video-choice${video.id === selectedVideo.id ? " active" : ""}`;
      button.dataset.videoId = video.id;
      button.setAttribute("aria-label", `${video.title} 선택 후 재생`);

      const image = document.createElement("img");
      image.src = video.cover;
      image.alt = "";

      const textWrap = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = video.title;
      const activist = document.createElement("small");
      activist.textContent = video.activist;
      textWrap.append(title, activist);

      const arrow = document.createElement("span");
      arrow.className = "choice-arrow";
      arrow.textContent = "▶";
      arrow.setAttribute("aria-hidden", "true");

      button.append(image, textWrap, arrow);
      button.addEventListener("click", async () => {
        selectedVideo = video;
        await renderSelectedVideo();
        els.choiceWrap.hidden = true;
        els.albumToggle.setAttribute("aria-expanded", "false");
        openVideo();
      });
      els.choiceList.append(button);
    });
  }

  async function renderSelectedVideo() {
    if (!selectedRegion || !selectedVideo) return;

    document.title = `${selectedRegion.name} | ${config.projectTitle || "815Hz 프로젝트: 재생 중"}`;
    els.regionTheme.textContent = selectedRegion.theme;
    els.detailTitle.textContent = selectedRegion.detailTitle || `${selectedRegion.name} 대표 앨범`;
    els.videoCountBadge.textContent = `${selectedRegion.videos.length}편`;
    els.coverImage.src = selectedVideo.cover;
    els.coverImage.alt = `${selectedVideo.title} 앨범 표지 전체 이미지`;
    els.videoTitle.textContent = selectedVideo.title;
    els.activistName.textContent = selectedVideo.activist;
    els.regionDescription.textContent = selectedRegion.description;
    els.albumActionText.textContent = selectedRegion.videos.length > 1 ? "앨범을 눌러 2편 선택" : "앨범을 눌러 바로 재생";
    els.albumToggle.setAttribute("aria-expanded", "false");
    els.choiceWrap.hidden = true;

    buildChoiceList();
    updateMapActiveState();
    updateAfterActiveState();

    const requestedVideoId = selectedVideo.id;
    els.viewCount.textContent = "…";
    const views = await fetchViews(requestedVideoId);
    if (selectedVideo?.id === requestedVideoId) {
      els.viewCount.textContent = views.toLocaleString("ko-KR");
    }
    setAfterViewCount(requestedVideoId, views);

    await renderComments();
    subscribeToComments(requestedVideoId);
  }

  function selectRegion(regionId, { scroll = true } = {}) {
    const found = regions.find((region) => region.id === regionId);
    if (!found) return;
    selectedRegion = found;
    selectedVideo = found.videos[0];
    renderSelectedVideo();

    if (scroll && window.matchMedia("(max-width: 1050px)").matches) {
      document.querySelector(".detail-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function playRegionFromMap(regionId) {
    selectRegion(regionId, { scroll: false });
    const found = regions.find((region) => region.id === regionId);
    if (!found) return;

    if (found.videos.length > 1) {
      els.choiceWrap.hidden = false;
      els.albumToggle.setAttribute("aria-expanded", "true");
      if (window.matchMedia("(max-width: 1050px)").matches) {
        document.querySelector(".detail-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
    openVideo();
  }

  async function openVideo() {
    if (!selectedVideo) return;

    const playingVideoId = selectedVideo.id;
    const youtubeEmbedUrl = buildYouTubeEmbedUrl(selectedVideo.youtube || "");
    els.videoError.hidden = true;
    els.dialogRegion.textContent = selectedRegion.name;
    els.dialogTitle.textContent = selectedVideo.title;

    // 이전에 재생하던 소스를 먼저 정리합니다.
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.load();
    els.videoPlayer.hidden = true;
    els.youtubePlayer.src = "about:blank";
    els.youtubePlayer.hidden = true;
    els.youtubeFallbackLink.hidden = true;

    if (youtubeEmbedUrl) {
      els.youtubePlayer.src = youtubeEmbedUrl;
      els.youtubePlayer.hidden = false;
      els.youtubeFallbackLink.href = selectedVideo.youtube;
      els.youtubeFallbackLink.hidden = false;
    } else if (selectedVideo.video) {
      els.videoPlayer.src = selectedVideo.video;
      els.videoPlayer.hidden = false;
      els.videoPlayer.load();
    } else {
      els.videoError.hidden = false;
      return;
    }

    if (typeof els.dialog.showModal === "function") {
      els.dialog.showModal();
    } else {
      els.dialog.setAttribute("open", "");
    }

    if (!youtubeEmbedUrl) {
      try {
        await els.videoPlayer.play();
      } catch {
        // 브라우저가 자동재생을 막으면 영상 내부 재생 버튼을 누르면 됩니다.
      }
    }

    const newCount = await incrementViews(playingVideoId);
    if (selectedVideo?.id === playingVideoId) {
      els.viewCount.textContent = newCount.toLocaleString("ko-KR");
    }
    setAfterViewCount(playingVideoId, newCount);
  }

  function closeVideo() {
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.load();
    els.videoPlayer.hidden = true;
    els.youtubePlayer.src = "about:blank";
    els.youtubePlayer.hidden = true;
    els.youtubeFallbackLink.hidden = true;
    els.videoError.hidden = true;

    if (typeof els.dialog.close === "function") els.dialog.close();
    else els.dialog.removeAttribute("open");
  }

  async function renderComments() {
    if (!config.commentsEnabled) {
      els.commentSection.hidden = true;
      return;
    }

    els.commentSection.hidden = false;
    if (!supabaseClient) {
      els.storageNotice.hidden = false;
      els.storageNotice.textContent = "현재는 미리보기 모드입니다. Supabase를 연결하면 모든 관람객의 댓글이 함께 저장되고 관리자 페이지에서 숨김·삭제할 수 있습니다.";
    } else {
      els.storageNotice.hidden = true;
    }

    els.commentList.innerHTML = '<p class="empty-comments">댓글을 불러오는 중입니다.</p>';

    try {
      const comments = await fetchComments(selectedVideo.id);
      els.commentCount.textContent = `${comments.length}개`;
      els.commentList.replaceChildren();

      if (!comments.length) {
        const empty = document.createElement("p");
        empty.className = "empty-comments";
        empty.textContent = "아직 댓글이 없습니다. 첫 번째 감상 한마디를 남겨보세요.";
        els.commentList.append(empty);
        return;
      }

      comments.forEach((comment) => {
        const item = document.createElement("article");
        item.className = "comment-item";

        const meta = document.createElement("div");
        meta.className = "comment-meta";
        const nickname = document.createElement("strong");
        nickname.textContent = comment.nickname;
        const time = document.createElement("time");
        time.dateTime = comment.created_at;
        time.textContent = formatDate(comment.created_at);
        meta.append(nickname, time);

        const content = document.createElement("p");
        content.textContent = comment.content;

        item.append(meta, content);
        els.commentList.append(item);
      });
    } catch (error) {
      els.commentList.innerHTML = `<p class="empty-comments">${error.message || "댓글을 불러오지 못했습니다."}</p>`;
    }
  }

  function subscribeToComments(videoId) {
    if (!supabaseClient || !config.realtimeComments) return;

    if (commentChannel) {
      supabaseClient.removeChannel(commentChannel);
      commentChannel = null;
    }

    commentChannel = supabaseClient
      .channel(`public-comments-${videoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_comments", filter: `video_id=eq.${videoId}` },
        () => {
          if (selectedVideo?.id === videoId) renderComments();
        }
      )
      .subscribe();
  }

  els.mapRegions.forEach((regionEl) => {
    regionEl.addEventListener("click", () => selectRegion(regionEl.dataset.region));
    regionEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRegion(regionEl.dataset.region);
      }
    });
  });

  els.mapPlayControls.forEach((control) => {
    const play = () => playRegionFromMap(control.dataset.mapPlay);
    control.addEventListener("click", play);
    control.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        play();
      }
    });
  });

  els.afterAlbumButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectAfterVideo(button.dataset.afterVideo, { playImmediately: true });
    });
  });

  els.albumToggle.addEventListener("click", () => {
    if (selectedRegion.videos.length > 1) {
      const shouldOpen = els.choiceWrap.hidden;
      els.choiceWrap.hidden = !shouldOpen;
      els.albumToggle.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen) els.choiceWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      openVideo();
    }
  });

  els.playButton.addEventListener("click", openVideo);
  els.closeDialog.addEventListener("click", closeVideo);
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) closeVideo();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.dialog.open) closeVideo();
  });
  els.videoPlayer.addEventListener("error", () => {
    els.videoError.hidden = false;
  });

  els.commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = els.commentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "등록 중…";

    try {
      await addComment(selectedVideo.id, els.nickname.value, els.commentText.value);
      els.commentText.value = "";
      await renderComments();
    } catch (error) {
      alert(error.message || "댓글을 등록하지 못했습니다.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "댓글 등록";
    }
  });

  window.addEventListener("beforeunload", () => {
    if (supabaseClient && commentChannel) supabaseClient.removeChannel(commentChannel);
  });

  if (!regions.length && !afterCollection) {
    document.body.innerHTML = "<p>data.js에서 영상 데이터를 확인해주세요.</p>";
    return;
  }

  renderSelectedVideo();
  refreshAfterIndependenceViews();
})();
