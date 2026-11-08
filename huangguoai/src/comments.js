load('config.js');

function mapComment(c) {
    let replies = [];
    let list = c.reply_list || [];
    list.forEach(function (reply) {
        replies.push(mapComment(reply));
    });
    return {
        name: c.nickname || "",
        avatar: c.avatar ? imgUrl(c.avatar) : "",
        content: c.content || c.text || "",
        description: (c.time || c.created_at || "") + (c.ip_region ? " · " + c.ip_region : ""),
        replies: replies
    };
}

function execute(input, page) {
    page = String(parseInt(page, 10) || 1);

    let url = input.indexOf("http") === 0 ? normalizeUrl(input) : BASE_URL + input;
    url += (url.indexOf("?") === -1 ? "?" : "&") + "page=" + page + "&size=20";

    let response = fetch(url, {
        headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" }
    });
    if (!response.ok) return Response.error("HTTP " + response.status);

    let json;
    try {
        json = response.json();
    } catch (e) {
        return Response.error("评论数据解析失败");
    }
    if (!json || json.status !== 1 || !json.data) return Response.error("评论加载失败");

    let items = [];
    let list = json.data.items || [];
    list.forEach(function (comment) {
        items.push(mapComment(comment));
    });

    let pages = 1;
    if (json.data.pagination) pages = parseInt(json.data.pagination.pages, 10) || 1;
    return Response.success(items, page < pages ? String(parseInt(page, 10) + 1) : "");
}
