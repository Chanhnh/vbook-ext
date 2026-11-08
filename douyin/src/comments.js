load('config.js');

function fetchReplies(videoId, commentId) {
    if (!videoId || !commentId) return [];
    var url = "https://so.douyin.com/aweme/v1/web/comment/list/reply/?device_platform=webapp&aid=581610&channel=channel_pc_web&item_id=" + videoId + "&comment_id=" + commentId + "&cursor=0&count=50";
    try {
        var res = fetch(url, {
            headers: {
                "User-Agent": MOBILE_UA,
                "Referer": BASE_URL + "/",
                "Cookie": getCookie()
            },
            timeout: 10000
        });
        if (!res.ok) return [];
        var json = res.json();
        var list = json.comments || [];
        var replies = [];
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            if (!r) continue;

            var user = r.user || {};
            var author = user.nickname || "";
            var avatar = "";
            if (user.avatar_thumb && user.avatar_thumb.url_list && user.avatar_thumb.url_list.length > 0) {
                avatar = user.avatar_thumb.url_list[0];
            }
            var text = (r.text || "").trim();
            if (!text) continue;

            var time = formatTime(r.create_time);
            var digg = (r.digg_count && r.digg_count > 0) ? (formatCount(r.digg_count) + " ❤️") : "";
            var ip = r.ip_label ? ("IP: " + r.ip_label) : "";

            var descParts = [];
            if (ip) descParts.push(ip);
            if (digg) descParts.push(digg);
            if (time) descParts.push(time);

            replies.push({
                name: author,
                avatar: avatar,
                content: text,
                description: descParts.join(" · "),
                replies: []
            });
        }
        return replies;
    } catch (e) {
        return [];
    }
}

function execute(input, page) {
    if (!input) {
        return Response.error("Video ID rỗng");
    }

    var match = String(input || "").match(/(\d{15,22})/);
    var videoId = match ? match[1] : String(input || "").trim();

    var cursor = 0;
    if (page && page !== "1" && page !== "0") {
        var p = parseInt(page, 10);
        if (!isNaN(p) && p > 0) cursor = p;
    }

    var url = "https://so.douyin.com/aweme/v1/web/comment/list/?aid=581610&channel=channel_pc_web&aweme_id=" + videoId + "&cursor=" + cursor + "&count=20";
    var res = fetch(url, {
        headers: {
            "User-Agent": MOBILE_UA,
            "Referer": BASE_URL + "/",
            "Cookie": getCookie()
        },
        timeout: 15000
    });

    if (!res.ok) {
        return Response.error("Lỗi kết nối bình luận: " + res.status);
    }

    var comments = [];
    var nextPage = "";

    try {
        var json = res.json();
        var list = json.comments || [];
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (!c) continue;

            var user = c.user || {};
            var author = user.nickname || "";
            var avatar = "";
            if (user.avatar_thumb && user.avatar_thumb.url_list && user.avatar_thumb.url_list.length > 0) {
                avatar = user.avatar_thumb.url_list[0];
            }
            var text = (c.text || "").trim();
            if (!text) continue;

            var time = formatTime(c.create_time);
            var digg = (c.digg_count && c.digg_count > 0) ? (formatCount(c.digg_count) + " ❤️") : "";
            var ip = c.ip_label ? ("IP: " + c.ip_label) : "";
            var repliesCount = (c.reply_comment_total && c.reply_comment_total > 0) ? (formatCount(c.reply_comment_total) + " 💬") : "";

            var descParts = [];
            if (ip) descParts.push(ip);
            if (digg) descParts.push(digg);
            if (repliesCount) descParts.push(repliesCount);
            if (time) descParts.push(time);

            var replies = [];
            if (c.reply_comment_total && c.reply_comment_total > 0 && c.cid) {
                replies = fetchReplies(videoId, c.cid);
            }

            comments.push({
                name: author,
                avatar: avatar,
                content: text,
                description: descParts.join(" · "),
                replies: replies
            });
        }

        if (json.has_more && json.cursor !== undefined && json.cursor !== null && comments.length > 0) {
            nextPage = String(json.cursor);
        }
    } catch (e) {
        return Response.error("Lỗi đọc dữ liệu bình luận");
    }

    return Response.success(comments, nextPage);
}
