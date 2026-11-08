// History request contract: yunsur/douyin-mcp, commit
// 7e90d139007f141cb7389aa509d8e6e67f7b5840, douyin/api_misc_social.go (MIT).

function isWatchHistoryEnabled() {
    try { return REPORT_WATCH_HISTORY === "true"; } catch (e) { return false; }
}

function dyWatchSession(cookies) {
    return cookies.sessionid || cookies.sessionid_ss || cookies.sid_tt || "";
}

function dyWatchEncode(value) {
    return encodeURIComponent(String(value)).replace(/[!'()*]/g, function (c) {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

function dyWatchRequest(context, url, extra, body, referer) {
    var cookies = context.cookies;
    var query = "device_platform=webapp&aid=6383&channel=channel_pc_web" + (extra || "");
    var uifid = cookies.UIFID || cookies.UIFID_TEMP || "";
    var fp = cookies.s_v_web_id || cookies.verifyFp || "";
    if (context.webId) query += "&webid=" + dyWatchEncode(context.webId);
    if (uifid) query += "&uifid=" + dyWatchEncode(uifid);
    if (fp) query += "&verifyFp=" + dyWatchEncode(fp) + "&fp=" + dyWatchEncode(fp);
    if (cookies.msToken) query += "&msToken=" + dyWatchEncode(cookies.msToken);
    var headers = {
        "User-Agent": context.ua,
        "Referer": referer || "https://www.douyin.com/?recommend=1",
        "Cookie": context.cookie
    };
    if (uifid) headers.uifid = uifid;
    if (url.indexOf("/aweme/detail/") !== -1) headers["x-tt-argus"] = "1";
    var options = { headers: headers, timeout: 3000 };
    if (body) {
        options.method = "POST";
        options.body = body;
        headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    }
    return fetch(url + "?" + query, options);
}

function dyWatchValidId(value) {
    return /^\d+$/.test(value) && value !== "0";
}

function reportWatchHistory(videoId) {
    if (!isWatchHistoryEnabled()) return "disabled";
    if (!/^\d{15,22}$/.test(String(videoId || ""))) return "invalid_video";
    try {
        // Đọc cookie trực tiếp để không đăng ký ttwid chỉ vì báo cáo lịch sử.
        var cookie = String(localCookie.getCookie() || "").trim();
        var cookies = parseCookie(cookie);
        var session = dyWatchSession(cookies);
        if (!session) return "not_logged_in";
        var sessionHash = CryptoJS.SHA256(session).toString();
        var key = "douyin.watch.sent." + sessionHash + "." + videoId;
        var now = Date.now();
        var previous = Number(cacheStorage.getItem(key)) || 0;
        if (previous > 0 && now >= previous && now - previous < 600000) return "duplicate";

        var context = { ua: getDesktopUA(), cookies: cookies, cookie: cookie, webId: "" };
        var webIdKey = "douyin.watch.webid." + sessionHash;
        var webId = cookies.tt_webid_v2 || cookies.tt_webid || String(cacheStorage.getItem(webIdKey) || "");
        var response, json;
        if (!dyWatchValidId(webId)) {
            // Lấy webid thật từ phiên Douyin nếu cookie và cache chưa có.
            response = dyWatchRequest(context, "https://www.douyin.com/aweme/v1/web/query/user",
                "&publish_video_strategy_type=2", "", "https://www.douyin.com/discover");
            if (!response.ok) return "session_unavailable";
            json = response.json();
            if (!json || (json.status_code !== undefined && String(json.status_code) !== "0")) return "session_unavailable";
            webId = String(json.id || "");
            if (!dyWatchValidId(webId)) return "session_unavailable";
            cacheStorage.setItem(webIdKey, webId);
        }
        context.webId = webId;
        context.cookie = String(localCookie.getCookie() || "").trim();
        context.cookies = parseCookie(context.cookie);
        if (dyWatchSession(context.cookies) !== session) return "session_changed";

        var authorId = String(cacheStorage.getItem("douyin.watch.author." + videoId) || "");
        if (!dyWatchValidId(authorId)) {
            // Trang chia sẻ chỉ có sec_uid; history/write cần uid số từ API detail.
            response = dyWatchRequest(context, "https://www.douyin.com/aweme/v1/web/aweme/detail/",
                "&aweme_id=" + videoId, "", "https://www.douyin.com/video/" + videoId);
            if (!response.ok) return "author_unavailable";
            json = response.json();
            if (!json || String(json.status_code) !== "0") return "author_unavailable";
            var item = json.aweme_detail;
            if (!item || String(item.aweme_id || "") !== String(videoId)) return "author_unavailable";
            rememberWatchAuthor(item);
            authorId = item.author && item.author.uid ? String(item.author.uid) : "";
        }
        if (!dyWatchValidId(authorId)) return "author_unavailable";

        response = dyWatchRequest(context, "https://www-hj.douyin.com/aweme/v1/web/history/write/", "",
            "author_id=" + authorId + "&aweme_id=" + videoId);
        if (!response.ok) return "request_failed";
        json = response.json();
        if (!json || String(json.status_code) !== "0") return "rejected";
        cacheStorage.setItem(key, String(Date.now()));
        return "sent";
    } catch (e) {
        return "failed";
    }
}
