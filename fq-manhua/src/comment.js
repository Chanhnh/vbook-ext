load('config.js');

function fqCommentStars(score) {
    var value = parseFloat(score);
    if (isNaN(value)) value = 0;
    var count = Math.round(value / 2);
    if (count < 0) count = 0;
    if (count > 5) count = 5;
    var out = "";
    var i;
    for (i = 0; i < 5; i++) out += i < count ? "⭐" : "☆";
    return out;
}

function fqCommentUser(user) {
    var info = user || {};
    return {
        name: String(info.user_name || "匿名"),
        avatar: String(info.user_avatar || "")
    };
}

function fqCommentReply(reply) {
    var item = reply || {};
    var user = fqCommentUser(item.user_info);
    return {
        name: user.name,
        avatar: user.avatar,
        content: String(item.text || ""),
        description: fqFormatDate(item.create_timestamp) +
            (item.digg_count ? "    •    " + item.digg_count + "❤️" : ""),
        replies: []
    };
}

function execute(url, page) {
    var current = parseInt(page, 10);
    if (!(current > 0)) current = 1;
    var target = String(url || "").replace("{{page}}", String((current - 1) * 10));
    if (typeof cmt_sort !== "undefined" && cmt_sort === "Mới nhất") target += "&sort=time";
    else if (typeof cmt_sort !== "undefined" && cmt_sort === "Nóng nhất") target += "&sort=1";

    var response = fetch(target, {
        headers: { "User-Agent": UserAgent.android() },
        timeout: 30000
    });
    if (!response.ok) return Response.error("Không tải được bình luận (HTTP " + response.status + ").");

    var json = response.json();
    if (!json || json.code !== 0 || !json.data) {
        return Response.success([], "");
    }

    var list = json.data.comment || [];
    var comments = [];
    var i;
    for (i = 0; i < list.length; i++) {
        var cmt = list[i] || {};
        var user = fqCommentUser(cmt.user_info);
        var replies = [];
        var rawReplies = cmt.reply_list || [];
        var j;
        for (j = 0; j < rawReplies.length; j++) replies.push(fqCommentReply(rawReplies[j]));
        comments.push({
            name: user.name,
            avatar: user.avatar,
            content: fqCommentStars(cmt.score) + "<br>" + String(cmt.text || ""),
            description: fqFormatDate(cmt.create_timestamp) +
                (cmt.digg_count || cmt.reply_count ? "    •    " : "") +
                (cmt.digg_count ? cmt.digg_count + "❤️" : "") +
                (cmt.digg_count && cmt.reply_count ? "  " : "") +
                (cmt.reply_count ? cmt.reply_count + "🗨️" : ""),
            replies: replies
        });
    }

    var next = json.data.has_more ? String(current + 1) : "";
    return Response.success(comments, next);
}
