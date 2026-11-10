load('config.js');
load('fq-crypto.js');

function fqParseParams(input) {
    if (!input) return {};
    if (typeof input === "object") return input;
    var trimmed = String(input).trim();
    if (trimmed.charAt(0) === "{" && trimmed.charAt(trimmed.length - 1) === "}") {
        try {
            return JSON.parse(trimmed);
        } catch (e) {}
    }
    var params = {};
    var parts = trimmed.split("&");
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i].split("=");
        if (p.length >= 2) {
            params[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join("="));
        }
    }
    return params;
}

function execute(input, next) {
    try {
        var params = fqParseParams(input);
        var commentId = String(params.comment_id || "");
        var bookId = String(params.book_id || "");
        var deviceId = String(params.device_id || "");

        if (!commentId) return Response.error("Thiếu comment_id");

        var query = "aid=1967" + (deviceId ? "&device_id=" + encodeURIComponent(deviceId) : "") + "&version_code=70132&device_platform=android&version_name=7.0.1.32";
        var url = "https://api5-normal-sinfonlineb.fqnovel.com/novel/commentapi/reply/list/" + encodeURIComponent(commentId) + "/v1/?" + query;
        var body = {
            "aid": 1967,
            "business_param": {
                "book_id": bookId,
                "need_count": false
            },
            "comment_id": commentId,
            "comment_source": 502,
            "comment_type": 1,
            "compliance_status": 0,
            "count": 10,
            "cursor": next ? String(next) : "",
            "group_id": bookId,
            "group_type": 15
        };

        var serialized = JSON.stringify(body);
        var headers = fqSignHeaders(url, serialized);
        headers["User-Agent"] = "com.dragon.read";
        headers["Content-Type"] = "application/json; charset=utf-8";

        var response = fetch(url, {
            method: "POST",
            headers: headers,
            body: serialized,
            timeout: 15000
        });

        if (!response.ok) {
            return Response.error("HTTP " + response.status);
        }

        var json = response.json();
        if (!json || !json.data) {
            return Response.error("Dữ liệu phản hồi không hợp lệ");
        }

        var replyList = json.data.reply_list || [];
        var replies = [];

        for (var i = 0; i < replyList.length; i++) {
            var reply = replyList[i].reply || replyList[i];
            var common = reply.Common || reply.common || {};
            var user = (common.user_info && common.user_info.base_info) || {};
            var time = common.create_timestamp;
            var digg = (reply.stat && reply.stat.digg_count) || 0;

            var descParts = [];
            if (time) descParts.push(formatChineseDate(time));
            if (digg) descParts.push(digg + "❤️");

            replies.push({
                name: user.user_name || "Người dùng",
                avatar: user.user_avatar || "",
                content: (common.content && common.content.text) || "",
                description: descParts.join("    •    "),
                replies: []
            });
        }

        var commentListInfo = json.data.comment_list_info || {};
        var nextToken = commentListInfo.has_more ? String(commentListInfo.cursor || "") : "";

        return Response.success(replies, nextToken);
    } catch (e) {
        return Response.error(e && e.message ? e.message : String(e));
    }
}
