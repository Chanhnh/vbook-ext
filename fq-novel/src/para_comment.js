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
        var itemId = String(params.item_id || "");
        var bookId = String(params.book_id || "");
        var itemVersion = String(params.item_version || "");
        var deviceId = String(params.device_id || "");
        var paraIndex = parseInt(params.para_index, 10);
        if (isNaN(paraIndex)) paraIndex = 0;

        if (!itemId) return Response.error("Thiếu item_id");

        var query = "aid=1967" + (deviceId ? "&device_id=" + encodeURIComponent(deviceId) : "") + "&version_code=70132&device_platform=android&version_name=7.0.1.32";
        var url = "https://api5-normal-sinfonlineb.fqnovel.com/novel/commentapi/comment/list/" + encodeURIComponent(itemId) + "/v1?" + query;
        var body = {
            "business_param": {
                "book_id": bookId,
                "item_version": itemVersion,
                "para_index": paraIndex,
                "need_count": true
            },
            "comment_source": 2,
            "comment_type": 1,
            "count": 20,
            "group_id": itemId,
            "group_type": 15,
            "server_channel": 38
        };
        if (next) {
            body.cursor = String(next);
        }

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
            return Response.error("Dữ liệu bình luận không hợp lệ");
        }

        var dataList = json.data.data_list || [];
        var comments = [];

        for (var i = 0; i < dataList.length; i++) {
            var item = dataList[i];
            var commentInfo = item.comment || item;
            var common = commentInfo.common || commentInfo.Common || {};
            var user = (common.user_info && common.user_info.base_info) || {};
            var commentId = String(commentInfo.comment_id || "");
            var stat = commentInfo.stat || {};
            var replyCount = parseInt(stat.reply_count, 10) || 0;
            var diggCount = parseInt(stat.digg_count, 10) || 0;
            var time = common.create_timestamp;

            var descParts = [];
            if (time) descParts.push(formatChineseDate(time));
            if (diggCount) descParts.push(diggCount + "❤️");
            if (replyCount) descParts.push(replyCount + "🗨️");

            var cmtObj = {
                name: user.user_name || "Người dùng",
                avatar: user.user_avatar || "",
                content: (common.content && common.content.text) || "",
                description: descParts.join("    •    "),
                replies: []
            };

            if (commentId && replyCount > 0) {
                cmtObj.reply_count = replyCount;
                cmtObj.reply = {
                    input: "comment_id=" + encodeURIComponent(commentId) + "&book_id=" + encodeURIComponent(bookId) + (deviceId ? "&device_id=" + encodeURIComponent(deviceId) : ""),
                    script: "para_reply.js"
                };
            }

            comments.push(cmtObj);
        }

        var commonInfo = json.data.common_list_info || {};
        var nextToken = commonInfo.has_more ? String(commonInfo.cursor || "") : "";

        return Response.success(comments, nextToken);
    } catch (e) {
        return Response.error(e && e.message ? e.message : String(e));
    }
}
