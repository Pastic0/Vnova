const VNOVA_NOTIFICATION_CACHE_KEY = "vnova:notifications:cache:v9";
const VNOVA_NOTIFICATION_CACHE_TTL_MS = 60 * 1000;
const VNOVA_NOTIFICATION_POLL_MS = 60 * 1000;
let vnovaNotificationBadgeRequest = null;

function getVnovaNotificationOwner() {
  return (sessionStorage.getItem("userEmail") || localStorage.getItem("userEmail") || "guest").toLowerCase();
}

function getVnovaNotificationCacheKey() {
  return `${VNOVA_NOTIFICATION_CACHE_KEY}:${getVnovaNotificationOwner()}`;
}

function getNotificationBadgeToken() {
  const cookie = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith("VnovaAuth="));
  return (cookie ? decodeURIComponent(cookie.slice("VnovaAuth=".length)) : "") || localStorage.getItem("idToken") || sessionStorage.getItem("idToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function readNotificationCache() {
  try {
    const raw = localStorage.getItem(getVnovaNotificationCacheKey());
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || !cached.expiresAt || Date.now() >= cached.expiresAt) {
      localStorage.removeItem(getVnovaNotificationCacheKey());
      return null;
    }
    return cached.value || null;
  } catch {
    return null;
  }
}

function saveNotificationCache(value) {
  try {
    localStorage.setItem(getVnovaNotificationCacheKey(), JSON.stringify({
      value,
      expiresAt: Date.now() + VNOVA_NOTIFICATION_CACHE_TTL_MS
    }));
  } catch { }
}

function renderNotificationBadge(total) {
  document.querySelectorAll("#notificationBadge, .notification-badge").forEach(badge => {
    const count = Number(total || 0);
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.style.display = count > 0 ? "flex" : "none";
  });
}

async function loadNotificationBadge(forceRefresh = false) {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;
  if (!forceRefresh) {
    const cached = readNotificationCache();
    if (cached) {
      renderNotificationBadge(Number(cached.unread_count || 0));
      return;
    }
  }
  if (vnovaNotificationBadgeRequest) {
    const result = await vnovaNotificationBadgeRequest.catch(() => null);
    if (result) renderNotificationBadge(Number(result.unread_count || 0));
    return;
  }

  try {
    const token = getNotificationBadgeToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    vnovaNotificationBadgeRequest = fetch("/api/notifications", {
      credentials: "same-origin",
      headers
    }).then(async response => {
      if (!response.ok) throw new Error("Không tải được thông báo");
      return response.json();
    });
    const result = await vnovaNotificationBadgeRequest;
    saveNotificationCache(result);
    renderNotificationBadge(Number(result.unread_count || 0));
  } catch {
    badge.style.display = "none";
  } finally {
    vnovaNotificationBadgeRequest = null;
  }
}

window.invalidateVnovaNotificationCache = function () {
  try { localStorage.removeItem(getVnovaNotificationCacheKey()); } catch { }
};

window.refreshVnovaNotificationBadge = function (forceRefresh = false) {
  return loadNotificationBadge(forceRefresh);
};

["vnova:notification-created", "vnova:notifications-read"].forEach(eventName => {
  window.addEventListener(eventName, function () {
    vnovaNotificationBadgeRequest = null;
    window.invalidateVnovaNotificationCache();
    loadNotificationBadge(true);
  });
});

window.addEventListener("vnova:notifications-cleared", function () {
  vnovaNotificationBadgeRequest = null;
  window.invalidateVnovaNotificationCache();
  renderNotificationBadge(0);
});

document.addEventListener("DOMContentLoaded", () => {
  loadNotificationBadge();
  setInterval(() => {
    if (!document.hidden) loadNotificationBadge();
  }, VNOVA_NOTIFICATION_POLL_MS);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadNotificationBadge();
});
