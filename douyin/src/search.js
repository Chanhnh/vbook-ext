load('config.js');

// Result riêng cho search: mở detail, không dùng type "short".
function buildSearchResult(item, fallbackId) {
    if (!item) return null;
    var id = item.aweme_id ? String(item.aweme_id) : String(fallbackId || "");
    if (!id) return null;

    var video = item.video || {};
    var title = item.desc ? String(item.desc).trim() : "Douyin Video " + id;
    var author = item.author && item.author.nickname ? String(item.author.nickname) : "Douyin";
    var cover = "";
    if (video.cover && video.cover.url_list && video.cover.url_list.length > 0) {
        cover = video.cover.url_list[0];
    } else if (video.origin_cover && video.origin_cover.url_list && video.origin_cover.url_list.length > 0) {
        cover = video.origin_cover.url_list[0];
    }

    var uri = video.play_addr && video.play_addr.uri ? video.play_addr.uri : "";
    var duration = video.duration || item.duration || 0;
    var link = BASE_URL + "/video/" + id;
    if (uri) link += "?uri=" + encodeURIComponent(uri);
    if (duration) link += (uri ? "&" : "?") + "dy_duration=" + duration;

    var mixId = "";
    if (item.mix_info && item.mix_info.mix_id) {
        mixId = String(item.mix_info.mix_id);
    } else if (item.series_basic_info && item.series_basic_info.series_id) {
        mixId = String(item.series_basic_info.series_id);
    } else if (item.series_info && item.series_info.series_id) {
        mixId = String(item.series_info.series_id);
    }
    if (mixId) link += (link.indexOf("?") >= 0 ? "&" : "?") + "mix_id=" + encodeURIComponent(mixId);

    var statistics = item.statistics || {};
    var tags = [];
    if (duration) tags.push(formatDuration(duration));
    if (statistics.digg_count) tags.push(formatCount(statistics.digg_count) + " ❤️");
    if (statistics.comment_count) tags.push(formatCount(statistics.comment_count) + " 💬");
    if (item.create_time) tags.push(formatTime(item.create_time));

    var result = {
        name: title,
        link: link,
        description: author
    };
    if (cover) result.cover = cover;
    if (tags.length > 0) result.tag = tags.join(" · ");
    return result;
}

function execute(query, page) {
    var keyword = String(query || "").trim();
    if (!keyword) {
        return Response.error("Nhập ID hoặc link video Douyin.");
    }

    var videoId = resolveVideoId(keyword);
    if (!videoId) {
        return Response.error("Douyin chỉ hỗ trợ tìm bằng ID hoặc link video.");
    }

    // Giữ mix_id cho TOC nếu video thuộc mix/series.
    var mixId = resolveMixId(keyword, videoId);

    var videoItem = fetchVideoInfo(videoId);
    if (!videoItem) {
        return Response.error("Không tìm thấy video Douyin với ID: " + videoId);
    }

    var result = buildSearchResult(videoItem, videoId);
    if (!result) {
        return Response.error("Không đọc được thông tin video Douyin.");
    }
    if (mixId && !/[?&]mix_id=/.test(result.link)) {
        result.link += (result.link.indexOf("?") >= 0 ? "&" : "?") + "mix_id=" + encodeURIComponent(mixId);
    }
    return Response.success([result], "");
}
