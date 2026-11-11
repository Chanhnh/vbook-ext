let WBI_MIXIN_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
    37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
    22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

function getWbiKeys() {
    requireLogin();
    if (SESSION_WBI) return SESSION_WBI;
    let account = requestJson("/x/web-interface/nav", {}, BASE_URL + "/", true);
    let keys = parseWbiKeys(account);
    if (!keys) throw new Error("Thiếu khóa WBI từ Bilibili.");
    SESSION_WBI = keys;
    return keys;
}

function wbiMixinKey(imgKey, subKey) {
    let raw = String(imgKey) + String(subKey);
    let out = "";
    for (let i = 0; i < WBI_MIXIN_TAB.length; i++) {
        out += raw.charAt(WBI_MIXIN_TAB[i]);
    }
    return out.slice(0, 32);
}

function wbiBuildQuery(params, keys) {
    let signed = Object.assign({}, params || {}, { wts: String(Math.floor(Date.now() / 1000)) });
    let names = Object.keys(signed).sort();
    let pairs = [];
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        let raw = signed[name] === undefined || signed[name] === null ? "" : String(signed[name]);
        let value = raw.replace(/[!'()*]/g, "");
        pairs.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
    }
    let query = pairs.join("&");
    let sign = CryptoJS.MD5(query + wbiMixinKey(keys.imgKey, keys.subKey)).toString();
    return query + "&w_rid=" + sign;
}

function requestWbiJson(path, params, referer, timeout) {
    let keys = getWbiKeys();
    // Append the pre-encoded WBI query directly so the transmitted query matches w_rid byte-for-byte.
    let url = API_URL + path + "?" + wbiBuildQuery(params, keys);
    let response = fetch(url, {
        headers: apiHeaders(referer),
        timeout: timeout || 20000
    });
    if (!response || !response.ok) {
        let status = response ? Number(response.status) : 504;
        if (status === 412 || status === 403) throw new Error("Bilibili đang chặn yêu cầu (HTTP " + status + "). Hãy thử lại sau.");
        throw new Error("Không tải được bình luận Bilibili: HTTP " + status);
    }
    let result;
    try {
        result = response.json();
    } catch (error) {
        throw new Error("Bilibili trả dữ liệu bình luận không phải JSON.");
    }
    if (!result || Number(result.code) !== 0) {
        let code = result ? Number(result.code) : -1;
        if (code === -101) {
            SESSION_READY = false;
            SESSION_COOKIE = "";
            SESSION_WBI = null;
            throw loginError();
        }
        if (code === 12002 || code === 12061) throw new Error("Video này đã tắt bình luận.");
        if (code === 12022) throw new Error("Bình luận này đã bị xóa hoặc không tồn tại.");
        if (code === -404 || code === 62002) throw new Error("Video không tồn tại hoặc đã bị xóa.");
        if (code === -352 || code === -403) throw new Error("Yêu cầu bình luận bị Bilibili từ chối (mã " + code + "). Hãy thử lại sau.");
        throw new Error("Bilibili không trả dữ liệu bình luận hợp lệ (mã " + code + ").");
    }
    if (!result.data || result.data.v_voucher) {
        throw new Error("Bilibili yêu cầu xác minh truy cập. Extension không tự vượt bước xác minh.");
    }
    return result.data;
}

function resolveCommentInput(input, requireRoot) {
    let raw = String(input || "").trim();
    if (!raw) throw new Error("Thiếu thông tin video để tải bình luận.");
    let parsed = null;
    if (raw.charAt(0) === "{") {
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            throw new Error("Dữ liệu đầu vào bình luận không hợp lệ.");
        }
    }
    let bvid = "";
    let aid = "";
    let root = "";
    let upperMid = "";
    if (parsed && !Array.isArray(parsed)) {
        bvid = String(parsed.bvid || "").trim();
        aid = String(parsed.aid || "").trim();
        root = String(parsed.root || "").trim();
        upperMid = String(parsed.upperMid || "").trim();
    } else if (/^BV[0-9A-Za-z]{10}$/.test(raw)) {
        bvid = raw;
    } else {
        bvid = videoInput(raw).bvid;
    }
    if (bvid && !/^BV[0-9A-Za-z]{10}$/.test(bvid)) {
        throw new Error("BVID bình luận không hợp lệ.");
    }
    if (!aid) {
        if (!bvid) throw new Error("Thiếu BVID hoặc AVID để tải bình luận.");
        let video = getVideo(bvid);
        aid = String(video.aid || "");
    }
    if (!/^[1-9][0-9]*$/.test(aid)) {
        throw new Error("AVID bình luận không hợp lệ.");
    }
    if (requireRoot && !/^[1-9][0-9]*$/.test(root)) {
        throw new Error("Mã bình luận gốc không hợp lệ.");
    }
    return { bvid: bvid, aid: aid, root: root, upperMid: upperMid };
}

function replyId(item) {
    if (!item) return "";
    let str = String(item.rpid_str || "").trim();
    if (/^[1-9][0-9]*$/.test(str)) return str;
    let num = listNumber(item.rpid);
    return num !== null && num > 0 ? String(num) : "";
}

function commentText(item) {
    let content = item && item.content ? item.content : {};
    let text = String(content.message || "").replace(/\r\n?/g, "\n").trim();
    let pics = Array.isArray(content.pictures) ? content.pictures : [];
    if (pics.length > 0) {
        let tag = pics.length === 1 ? "[Hình ảnh]" : "[" + pics.length + " hình ảnh]";
        text = text ? text + " " + tag : tag;
    }
    return text;
}

function commentLocation(item) {
    let ctrl = item && item.reply_control ? item.reply_control : {};
    return String(ctrl.location || "").trim().replace(/^IP属地[：:]\s*/, "");
}

function commentDescription(item, options) {
    let parts = [];
    if (options.isPinned) parts.push("📌 Ghim");
    let member = item && item.member ? item.member : {};
    let mid = member.mid !== undefined && member.mid !== null ? String(member.mid) : "";
    if (options.upperMid && mid && mid === String(options.upperMid)) parts.push("UP");
    if (item && item.up_action && item.up_action.like) parts.push("UP đã thích");
    let likes = listNumber(item && item.like);
    if (likes !== null && likes > 0) parts.push(countText(likes) + " 👍");
    let rcount = listNumber(item && item.rcount);
    if (options.includeReplyCount && rcount !== null && rcount > 0) parts.push(countText(rcount) + " 💬");
    let time = publishedText(item && item.ctime);
    if (!time && item && item.reply_control && item.reply_control.time_desc) {
        time = String(item.reply_control.time_desc).trim();
    }
    if (time) parts.push(time);
    let loc = commentLocation(item);
    if (loc) parts.push("IP: " + loc);
    return parts.join(" · ");
}

function mapCommentItem(item, options) {
    let text = commentText(item);
    if (!text) return null;
    let member = item && item.member ? item.member : {};
    let name = String(member.uname || "").trim() || "Người dùng Bilibili";
    let avatar = member.avatar ? imageUrl(member.avatar) : "";
    let replies = [];
    if (options.includePreview && Array.isArray(item.replies)) {
        for (let i = 0; i < item.replies.length; i++) {
            let mapped = mapCommentItem(item.replies[i], {
                upperMid: options.upperMid,
                isPinned: false,
                includePreview: false,
                includeReplyCount: false,
                includeReplyPager: false
            });
            if (mapped) replies.push(mapped);
        }
    }
    let out = {
        name: name,
        avatar: avatar,
        content: text,
        description: commentDescription(item, options),
        replies: replies
    };
    let rcount = listNumber(item && item.rcount);
    let rpid = replyId(item);
    if (options.includeReplyPager && rpid && rcount !== null && rcount > replies.length) {
        out.reply_count = rcount;
        out.reply = {
            input: JSON.stringify({
                bvid: options.bvid,
                aid: options.aid,
                root: rpid,
                upperMid: options.upperMid || ""
            }),
            script: "reply.js"
        };
    }
    return out;
}
