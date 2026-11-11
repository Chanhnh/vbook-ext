load('config.js');
load('crypto.js');
load('comment_common.js');

function execute(input, page) {
    try {
        let ctx = resolveCommentInput(input, true);
        let number = pageNumber(page);
        let referer = ctx.bvid ? videoUrl(ctx.bvid) : (BASE_URL + "/video/av" + ctx.aid);
        let data = requestWbiJson("/x/v2/reply/reply", {
            oid: ctx.aid,
            type: "1",
            root: ctx.root,
            ps: "20",
            pn: String(number),
            web_location: "1315875"
        }, referer);
        let upperMid = ctx.upperMid || (data.upper && data.upper.mid !== undefined && data.upper.mid !== null
            ? String(data.upper.mid) : "");
        let list = Array.isArray(data.replies) ? data.replies : [];
        let items = [];
        let options = {
            bvid: ctx.bvid,
            aid: ctx.aid,
            upperMid: upperMid,
            isPinned: false,
            includePreview: false,
            includeReplyCount: false,
            includeReplyPager: false
        };
        for (let i = 0; i < list.length; i++) {
            let mapped = mapCommentItem(list[i], options);
            if (mapped) items.push(mapped);
        }
        let pageInfo = data.page || {};
        let current = listNumber(pageInfo.num) || number;
        let size = listNumber(pageInfo.size) || 20;
        let total = listNumber(pageInfo.count) || 0;
        let hasMore = items.length > 0 && (current * size) < total;
        return Response.success(items, hasMore ? String(current + 1) : "");
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
