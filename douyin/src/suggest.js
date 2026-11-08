load('config.js');

function buildSuggestedVideo(item) {
    if (!item || Number(item.aweme_type) === 101 || Number(item.aweme_type) === 68 || (item.images && item.images.length)) return null;
    var id = String(item.aweme_id || "");
    if (!/^\d{15,22}$/.test(id)) return null;
    var video = item.video || {};
    var uri = video.play_addr && video.play_addr.uri ? String(video.play_addr.uri).trim() : "";
    // Bài ảnh có thể chứa video.play_addr trỏ tới MP3, không phải URI nguồn MP4.
    if (!uri || /^https?:/i.test(uri)) return null;

    var title = String(item.desc || "").trim() || ("Douyin Video " + id);
    var author = item.author && item.author.nickname ? String(item.author.nickname) : "Douyin";
    var duration = video.duration || item.duration || 0;
    var link = BASE_URL + "/video/" + id + "?uri=" + encodeURIComponent(uri);
    if (duration) link += "&dy_duration=" + duration;
    var mixId = "";
    if (item.mix_info && item.mix_info.mix_id) {
        mixId = String(item.mix_info.mix_id);
    } else if (item.series_basic_info && item.series_basic_info.series_id) {
        mixId = String(item.series_basic_info.series_id);
    } else if (item.series_info && item.series_info.series_id) {
        mixId = String(item.series_info.series_id);
    }
    if (mixId) link += "&mix_id=" + encodeURIComponent(mixId);

    var result = { name: title, link: link, description: author };
    if (video.cover && video.cover.url_list && video.cover.url_list.length) {
        result.cover = video.cover.url_list[0];
    } else if (video.origin_cover && video.origin_cover.url_list && video.origin_cover.url_list.length) {
        result.cover = video.origin_cover.url_list[0];
    }
    var statistics = item.statistics || {};
    var tags = [];
    if (duration) tags.push(formatDuration(duration));
    if (statistics.digg_count) tags.push(formatCount(statistics.digg_count) + " ❤️");
    if (statistics.comment_count) tags.push(formatCount(statistics.comment_count) + " 💬");
    if (item.create_time) tags.push(formatTime(item.create_time));
    if (tags.length) result.tag = tags.join(" · ");
    rememberWatchAuthor(item);
    return result;
}

function execute(input, page) {
    var authorId = String(input || "").trim();
    var numericId = /^[1-9]\d*$/.test(authorId);
    if (!numericId && !isDouyinSecUid(authorId)) return Response.error("ID tác giả Douyin không hợp lệ");
    var cursor = String(page || "0").trim();
    if (!/^\d+$/.test(cursor)) return Response.error("Cursor danh sách Douyin không hợp lệ");

    try {
        var cookie = String(localCookie.getCookie() || "").trim();
        var cookies = parseCookie(cookie);
        var headers = {
            "User-Agent": getDesktopUA(),
            "Referer": BASE_URL + "/",
            "Accept": "application/json, text/plain, */*",
            "Cookie": cookie,
            "x-tt-argus": "1"
        };
        if (cookies.UIFID || cookies.UIFID_TEMP) headers.uifid = cookies.UIFID || cookies.UIFID_TEMP;
        var identityKey = numericId ? "user_id" : "sec_user_id";
        var url = BASE_URL + "/aweme/v1/web/aweme/post/?aid=6383&" + identityKey + "=" +
            encodeURIComponent(authorId) + "&max_cursor=" + encodeURIComponent(cursor) + "&count=18";
        var response = fetch(url, { headers: headers, timeout: 10000 });
        if (!response.ok) return Response.error("Không tải được video tác giả Douyin (HTTP " + response.status + ")");
        var json = response.json();
        if (!json || String(json.status_code) !== "0" || (json.aweme_list !== null && !Array.isArray(json.aweme_list))) {
            return Response.error("Douyin không trả danh sách video hợp lệ cho tác giả này");
        }

        var items = [];
        var seen = {};
        var list = json.aweme_list || [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item) continue;
            var author = item.author || {};
            var returnedId = String(numericId ? (author.uid || "") : (author.sec_uid || ""));
            // ID sai có thể trả video của tài khoản đang đăng nhập với status_code=0.
            if (returnedId !== authorId) return Response.error("Douyin trả danh sách không đúng tác giả");
            var id = String(item.aweme_id || "");
            if (seen[id]) continue;
            var result = buildSuggestedVideo(item);
            if (!result) continue;
            seen[id] = true;
            items.push(result);
        }
        var nextCursor = json.max_cursor === undefined || json.max_cursor === null ? "" : String(json.max_cursor);
        var hasMore = json.has_more === true || String(json.has_more) === "1";
        var nextPage = hasMore && /^\d+$/.test(nextCursor) && nextCursor !== "0" && nextCursor !== cursor ? nextCursor : "";
        return Response.success(items, nextPage);
    } catch (e) {
        return Response.error("Không đọc được danh sách video tác giả Douyin");
    }
}
