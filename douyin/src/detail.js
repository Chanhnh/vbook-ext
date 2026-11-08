load('config.js');

function execute(url) {
    var videoId = resolveVideoId(url);
    if (!videoId) return Response.error("Không tìm thấy ID video Douyin");

    // URL có mix_id thì dùng luôn; nếu không, helper kiểm tra mix/series qua API detail.
    var mixId = resolveMixId(url, videoId);

    var item = fetchVideoInfo(videoId);
    if (!item) {
        return Response.error("Không tải được thông tin video từ Douyin");
    }

    var video = item.video || {};
    var statistics = item.statistics || {};
    var author = item.author && item.author.nickname ? item.author.nickname : "";
    var title = item.desc ? String(item.desc).trim() : ("Douyin Video " + videoId);
    if (!title) title = "Douyin Video " + videoId;

    var cover = "";
    if (video.cover && video.cover.url_list && video.cover.url_list.length > 0) {
        cover = video.cover.url_list[0];
    } else if (video.origin_cover && video.origin_cover.url_list && video.origin_cover.url_list.length > 0) {
        cover = video.origin_cover.url_list[0];
    }

    var uri = video.play_addr && video.play_addr.uri ? video.play_addr.uri : "";
    var duration = video.duration || item.duration || 0;
    var canonicalUrl = BASE_URL + "/video/" + videoId;
    if (uri) canonicalUrl += "?uri=" + encodeURIComponent(uri);
    if (duration) canonicalUrl += (uri ? "&" : "?") + "dy_duration=" + duration;
    if (mixId) canonicalUrl += (canonicalUrl.indexOf("?") >= 0 ? "&" : "?") + "mix_id=" + encodeURIComponent(mixId);

    var durationText = duration ? formatDuration(duration) : "";
    var timeText = item.create_time ? formatTime(item.create_time) : "";
    var likeText = statistics.digg_count ? formatCount(statistics.digg_count) : "";
    var commentText = statistics.comment_count ? formatCount(statistics.comment_count) : "";
    var shareText = statistics.share_count ? formatCount(statistics.share_count) : "";
    var collectText = statistics.collect_count ? formatCount(statistics.collect_count) : "";
    var playText = statistics.play_count ? formatCount(statistics.play_count) : "";

    var detailLines = ["ID: " + videoId];
    if (author) detailLines.push("Tác giả: " + author);
    if (durationText) detailLines.push("Thời lượng: " + durationText);
    if (timeText) detailLines.push("Thời gian: " + timeText);
    if (likeText) detailLines.push("Lượt thích: " + likeText);
    if (commentText) detailLines.push("Bình luận: " + commentText);
    if (shareText) detailLines.push("Chia sẻ: " + shareText);
    if (collectText) detailLines.push("Lưu trữ: " + collectText);
    if (playText) detailLines.push("Lượt xem: " + playText);

    var result = {
        name: title,
        author: author,
        description: title,
        detail: detailLines.join("<br>"),
        url: canonicalUrl,
        type: "video",
        ongoing: false,
        comments: [
            { title: "Bình luận", input: videoId, script: "comments.js" }
        ]
    };
    var authorId = getSuggestionAuthorId(item, videoId);
    if (String(author || "").trim() && authorId) {
        result.suggests = [
            { title: author, input: authorId, script: "suggest.js" }
        ];
    }
    if (cover) result.cover = cover;
    return Response.success(result);
}
