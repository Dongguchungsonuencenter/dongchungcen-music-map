(() => {
  "use strict";

  const config = window.APP_CONFIG || {};
  const regions = Array.isArray(window.REGION_LIBRARY) ? window.REGION_LIBRARY : [];
  const afterCollection = window.AFTER_INDEPENDENCE_LIBRARY || null;

  const videoEntries = [
    ...regions.flatMap((region) => (region.videos || []).map((video) => ({
      ...video,
      regionName: region.name,
      displayName: `${region.name} · ${video.title}`,
    }))),
    ...((afterCollection?.videos || []).map((video) => ({
      ...video,
      regionName: afterCollection.name,
      displayName: `${afterCollection.name} · ${video.title}`,
    }))),
  ];
  const videoById = new Map(videoEntries.map((video) => [video.id, video]));

  const els = {
    setupPanel: document.getElementById("setup-panel"),
    loginPanel: document.getElementById("login-panel"),
    loginForm: document.getElementById("login-form"),
    email: document.getElementById("admin-email"),
    password: document.getElementById("admin-password"),
    loginMessage: document.getElementById("login-message"),
    logoutButton: document.getElementById("logout-button"),
    dashboard: document.getElementById("dashboard"),
    adminAccount: document.getElementById("admin-account"),
    refreshButton: document.getElementById("refresh-button"),
    searchInput: document.getElementById("search-input"),
    videoFilter: document.getElementById("video-filter"),
    statusFilter: document.getElementById("status-filter"),
    statTotal: document.getElementById("stat-total"),
    statVisible: document.getElementById("stat-visible"),
    statHidden: document.getElementById("stat-hidden"),
    statViews: document.getElementById("stat-views"),
    message: document.getElementById("dashboard-message"),
    tableWrap: document.getElementById("comment-table-wrap"),
    deleteDialog: document.getElementById("delete-dialog"),
    confirmDelete: document.getElementById("confirm-delete"),
  };

  const hasSupabase = Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    window.supabase?.createClient
  );

  let supabaseClient = null;
  let allComments = [];
  let allViews = [];
  let pendingDeleteId = null;
  let realtimeChannel = null;

  if (hasSupabase) {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function getVideoName(videoId) {
    return videoById.get(videoId)?.displayName || videoId;
  }

  function populateVideoFilter() {
    videoEntries.forEach((video) => {
      const option = document.createElement("option");
      option.value = video.id;
      option.textContent = video.displayName;
      els.videoFilter.append(option);
    });
  }

  function setLoginBusy(isBusy) {
    const button = els.loginForm.querySelector('button[type="submit"]');
    button.disabled = isBusy;
    button.textContent = isBusy ? "확인 중…" : "로그인";
  }

  async function verifyAdmin(session) {
    if (!session?.user) return false;
    const { data, error } = await supabaseClient.rpc("is_admin");
    if (error) {
      console.error(error);
      throw new Error("관리자 권한을 확인하지 못했습니다. supabase_setup.sql 실행 여부를 확인해주세요.");
    }
    return data === true;
  }

  async function showDashboard(session) {
    const isAdmin = await verifyAdmin(session);
    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      throw new Error("관리자 권한이 등록되지 않은 계정입니다.");
    }

    els.loginPanel.hidden = true;
    els.dashboard.hidden = false;
    els.logoutButton.hidden = false;
    els.adminAccount.textContent = `로그인 계정: ${session.user.email || "관리자"}`;
    await loadDashboard();
    subscribeRealtime();
  }

  function showLogin(message = "") {
    els.loginPanel.hidden = false;
    els.dashboard.hidden = true;
    els.logoutButton.hidden = true;
    els.loginMessage.textContent = message;
    if (realtimeChannel && supabaseClient) {
      supabaseClient.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  async function loadDashboard() {
    els.message.textContent = "댓글과 조회수를 불러오는 중입니다.";
    els.refreshButton.disabled = true;

    const [commentsResult, viewsResult] = await Promise.all([
      supabaseClient
        .from("video_comments")
        .select("id, video_id, nickname, content, is_hidden, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseClient
        .from("video_views")
        .select("video_id, views")
        .order("views", { ascending: false }),
    ]);

    els.refreshButton.disabled = false;

    if (commentsResult.error) {
      console.error(commentsResult.error);
      els.message.textContent = "댓글을 불러오지 못했습니다. 관리자 권한과 RLS 설정을 확인해주세요.";
      return;
    }

    if (viewsResult.error) {
      console.warn(viewsResult.error);
      allViews = [];
    } else {
      allViews = viewsResult.data || [];
    }

    allComments = commentsResult.data || [];
    renderStats();
    renderComments();
    els.message.textContent = `댓글 ${allComments.length}개를 불러왔습니다.`;
  }

  function renderStats() {
    const hidden = allComments.filter((comment) => comment.is_hidden).length;
    const visible = allComments.length - hidden;
    const views = allViews.reduce((sum, item) => sum + Number(item.views || 0), 0);

    els.statTotal.textContent = allComments.length.toLocaleString("ko-KR");
    els.statVisible.textContent = visible.toLocaleString("ko-KR");
    els.statHidden.textContent = hidden.toLocaleString("ko-KR");
    els.statViews.textContent = views.toLocaleString("ko-KR");
  }

  function getFilteredComments() {
    const query = els.searchInput.value.trim().toLocaleLowerCase("ko-KR");
    const videoId = els.videoFilter.value;
    const status = els.statusFilter.value;

    return allComments.filter((comment) => {
      const matchesQuery = !query ||
        comment.nickname.toLocaleLowerCase("ko-KR").includes(query) ||
        comment.content.toLocaleLowerCase("ko-KR").includes(query);
      const matchesVideo = videoId === "all" || comment.video_id === videoId;
      const matchesStatus = status === "all" ||
        (status === "hidden" && comment.is_hidden) ||
        (status === "visible" && !comment.is_hidden);
      return matchesQuery && matchesVideo && matchesStatus;
    });
  }

  function createActionButton(text, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  }

  function renderComments() {
    const comments = getFilteredComments();
    els.tableWrap.replaceChildren();

    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "조건에 맞는 댓글이 없습니다.";
      els.tableWrap.append(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "comment-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>상태</th>
          <th>영상</th>
          <th>별명</th>
          <th>댓글 내용</th>
          <th>작성일</th>
          <th>관리</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement("tbody");

    comments.forEach((comment) => {
      const row = document.createElement("tr");

      const statusCell = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = `status-badge ${comment.is_hidden ? "status-hidden" : "status-visible"}`;
      statusBadge.textContent = comment.is_hidden ? "숨김" : "공개";
      statusCell.append(statusBadge);

      const videoCell = document.createElement("td");
      videoCell.className = "video-name";
      videoCell.textContent = getVideoName(comment.video_id);

      const nicknameCell = document.createElement("td");
      nicknameCell.textContent = comment.nickname;

      const contentCell = document.createElement("td");
      contentCell.className = "comment-content";
      contentCell.textContent = comment.content;

      const dateCell = document.createElement("td");
      dateCell.className = "date-cell";
      dateCell.textContent = formatDate(comment.created_at);

      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "row-actions";

      const toggleButton = createActionButton(
        comment.is_hidden ? "복원" : "숨김",
        comment.is_hidden ? "restore-action" : "hide-action",
        () => setCommentVisibility(comment.id, !comment.is_hidden)
      );
      const deleteButton = createActionButton(
        "삭제",
        "delete-action",
        () => openDeleteDialog(comment.id)
      );
      actions.append(toggleButton, deleteButton);
      actionCell.append(actions);

      row.append(statusCell, videoCell, nicknameCell, contentCell, dateCell, actionCell);
      tbody.append(row);
    });

    table.append(tbody);
    els.tableWrap.append(table);
  }

  async function setCommentVisibility(commentId, hidden) {
    els.message.textContent = hidden ? "댓글을 숨기는 중입니다." : "댓글을 복원하는 중입니다.";

    const { data: authData } = await supabaseClient.auth.getUser();
    const patch = {
      is_hidden: hidden,
      hidden_at: hidden ? new Date().toISOString() : null,
      hidden_by: hidden ? authData?.user?.id || null : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from("video_comments")
      .update(patch)
      .eq("id", commentId);

    if (error) {
      console.error(error);
      els.message.textContent = "처리하지 못했습니다. 관리자 권한을 확인해주세요.";
      return;
    }

    const target = allComments.find((comment) => comment.id === commentId);
    if (target) Object.assign(target, patch);
    renderStats();
    renderComments();
    els.message.textContent = hidden ? "댓글을 관람 페이지에서 숨겼습니다." : "댓글을 다시 공개했습니다.";
  }

  function openDeleteDialog(commentId) {
    pendingDeleteId = commentId;
    if (typeof els.deleteDialog.showModal === "function") {
      els.deleteDialog.showModal();
    } else {
      const confirmed = window.confirm("댓글을 완전히 삭제할까요? 삭제한 댓글은 복원할 수 없습니다.");
      if (confirmed) deleteComment(commentId);
    }
  }

  async function deleteComment(commentId) {
    els.message.textContent = "댓글을 완전히 삭제하는 중입니다.";
    const { error } = await supabaseClient
      .from("video_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error(error);
      els.message.textContent = "댓글을 삭제하지 못했습니다. 관리자 권한을 확인해주세요.";
      return;
    }

    allComments = allComments.filter((comment) => comment.id !== commentId);
    renderStats();
    renderComments();
    els.message.textContent = "댓글을 완전히 삭제했습니다.";
  }

  function subscribeRealtime() {
    if (!config.realtimeComments || realtimeChannel) return;
    realtimeChannel = supabaseClient
      .channel("admin-video-comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_comments" },
        () => loadDashboard()
      )
      .subscribe();
  }

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;

    setLoginBusy(true);
    els.loginMessage.textContent = "";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: els.email.value.trim(),
      password: els.password.value,
    });

    if (error) {
      setLoginBusy(false);
      els.loginMessage.textContent = "이메일 또는 비밀번호를 확인해주세요.";
      return;
    }

    try {
      await showDashboard(data.session);
      els.password.value = "";
    } catch (adminError) {
      showLogin(adminError.message);
    } finally {
      setLoginBusy(false);
    }
  });

  els.logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showLogin("로그아웃했습니다.");
  });

  els.refreshButton.addEventListener("click", loadDashboard);
  els.searchInput.addEventListener("input", renderComments);
  els.videoFilter.addEventListener("change", renderComments);
  els.statusFilter.addEventListener("change", renderComments);

  els.deleteDialog.addEventListener("close", () => {
    if (els.deleteDialog.returnValue === "confirm" && pendingDeleteId) {
      deleteComment(pendingDeleteId);
    }
    pendingDeleteId = null;
  });

  populateVideoFilter();

  async function init() {
    if (!hasSupabase) {
      els.setupPanel.hidden = false;
      els.loginForm.querySelectorAll("input, button").forEach((element) => {
        element.disabled = true;
      });
      els.loginMessage.textContent = "먼저 Supabase 연결 설정을 완료해주세요.";
      return;
    }

    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) {
      showLogin();
      return;
    }

    try {
      await showDashboard(data.session);
    } catch (error) {
      showLogin(error.message);
    }
  }

  init();
})();
