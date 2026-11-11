load('config.js');
load('crypto.js');
load('comment_common.js');

function commentState(page) {
    page = String(page || "").trim();
    if (!page || page === "1" || page === "0") return { offset: "", top: [] };
    try {
        if (page.length > 8000) throw new Error("Token quá dài.");
        let state = JSON.parse(page);
        if (!state || Array.isArray(state) || typeof state.offset !== "string" ||
            !Array.isArray(state.top) || state.top.length > 50) {
            throw new Error("Token không hợp lệ.");
        }
        let top = [];
        for (let i = 0; i < state.top.length; i++) {
            if (typeof state.top[i] !== "string" || !/^[1-9][0-9]*$/.test(state.top[i])) {
                throw new Error("ID ghim không hợp lệ.");
            }
            top.push(state.top[i]);
        }
        return { offset: state.offset, top: top };
    } catch (error) {
        throw new Error("Dữ liệu phân trang bình luận không hợp lệ. Hãy tải lại từ đầu.");
    }
}

function appendComment(items, seen, rawItem, options) {
    let id = replyId(rawItem);
    if (id && seen[id]) return;
    let mapped = mapCommentItem(rawItem, options);
    if (!mapped) return;
    if (id) seen[id] = true;
    items.push(mapped);
}

function execute(input, page) {
    try {
        let ctx = resolveCommentInput(input, false);
        let state = commentState(page);
        let referer = ctx.bvid ? videoUrl(ctx.bvid) : (BASE_URL + "/video/av" + ctx.aid);
        let data = requestWbiJson("/x/v2/reply/wbi/main", {
            oid: ctx.aid,
            type: "1",
            mode: "3",
            pagination_str: JSON.stringify({ offset: state.offset }),
            plat: "1",
            seek_rpid: "",
            web_location: "1315875"
        }, referer);
        let upperMid = data.upper && data.upper.mid !== undefined && data.upper.mid !== null
            ? String(data.upper.mid) : "";
        let seen = {};
        let topIds = [];
        for (let i = 0; i < state.top.length; i++) {
            seen[state.top[i]] = true;
            topIds.push(state.top[i]);
        }
        let items = [];
        let baseOptions = {
            bvid: ctx.bvid,
            aid: ctx.aid,
            upperMid: upperMid,
            isPinned: false,
            includePreview: true,
            includeReplyCount: true,
            includeReplyPager: true
        };
        if (!state.offset) {
            let pinned = [];
            if (Array.isArray(data.top_replies)) {
                for (let i = 0; i < data.top_replies.length; i++) pinned.push(data.top_replies[i]);
            }
            if (data.top && data.top.upper) pinned.push(data.top.upper);
            let pinOptions = Object.assign({}, baseOptions, { isPinned: true });
            for (let i = 0; i < pinned.length; i++) {
                let id = replyId(pinned[i]);
                let before = items.length;
                appendComment(items, seen, pinned[i], pinOptions);
                if (items.length > before && id) topIds.push(id);
            }
        }
        let list = Array.isArray(data.replies) ? data.replies : [];
        for (let i = 0; i < list.length; i++) {
            appendComment(items, seen, list[i], baseOptions);
        }
        let cursor = data.cursor || {};
        let nextOffset = String(
            (cursor.pagination_reply && cursor.pagination_reply.next_offset) ||
            cursor.next_offset || ""
        );
        let hasMore = cursor.is_end !== true && Boolean(nextOffset) && items.length > 0;
        let nextToken = hasMore ? JSON.stringify({ offset: nextOffset, top: topIds.slice(0, 50) }) : "";
        return Response.success(items, nextToken);
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
