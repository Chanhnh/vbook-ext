load('config.js');

var PAGE_SIZE = 30;
var LIST_CACHE_KEY = "shortdrama.list.v1";
var LIST_CACHE_TTL = 600000;

function loadAllDramas() {
    try {
        var raw = cacheStorage.getItem(LIST_CACHE_KEY);
        if (raw) {
            var saved = JSON.parse(raw);
            if (saved && saved.time && (Date.now() - saved.time) < LIST_CACHE_TTL && saved.items) {
                return saved.items;
            }
        }
    } catch (e) {
    }

    var all = [];
    var page = 1;
    var totalPages = 1;

    while (page <= totalPages && page <= 10) {
        var data = apiGet("/short-dramas?productId=1&sortBy=heat&page=" + page + "&size=100");
        if (!data) break;

        var items = data.items || [];
        for (var i = 0; i < items.length; i++) all.push(items[i]);

        totalPages = parseInt(data.totalPages, 10) || 1;
        if (!items.length) break;
        page++;
    }

    if (all.length) {
        try {
            cacheStorage.setItem(LIST_CACHE_KEY, JSON.stringify({ time: Date.now(), items: all }));
        } catch (e) {
        }
    }
    return all;
}

function mapItems(list) {
    var items = [];
    if (!list) return items;
    for (var i = 0; i < list.length; i++) {
        var item = toItem(list[i]);
        if (item && item.name) items.push(item);
    }
    return items;
}

function serverList(path, page) {
    var data = apiGet(path + (path.indexOf("?") === -1 ? "?" : "&") + "page=" + page + "&size=" + PAGE_SIZE);
    if (!data) return null;

    var totalPages = parseInt(data.totalPages, 10) || 1;
    return {
        items: mapItems(data.items || []),
        next: page < totalPages ? String(page + 1) : ""
    };
}

function execute(query, page) {
    query = String(query || "").trim();
    page = parseInt(page, 10);
    if (isNaN(page) || page < 1) page = 1;

    if (query === "rank") {
        var result = serverList("/short-dramas/rankings?productId=1&mode=configured", page);
        if (!result) return Response.error("Không tải được bảng xếp hạng phim ngắn.");
        return Response.success(result.items, result.next);
    }

    if (query === "sort:latest") {
        var latest = serverList("/short-dramas?productId=1&sortBy=latest", page);
        if (!latest) return Response.error("Không tải được danh sách phim ngắn mới nhất.");
        return Response.success(latest.items, latest.next);
    }

    if (query === "sort:heat" || !query) {
        var hot = serverList("/short-dramas?productId=1&sortBy=heat", page);
        if (!hot) return Response.error("Không tải được danh sách phim ngắn.");
        return Response.success(hot.items, hot.next);
    }

    var all = loadAllDramas();
    if (!all.length) return Response.error("Không tải được danh sách phim ngắn để tìm kiếm.");

    var keyword = query.toLowerCase();
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
        var title = String(all[i].title || "").toLowerCase();
        if (title.indexOf(keyword) !== -1) filtered.push(all[i]);
    }

    var start = (page - 1) * PAGE_SIZE;
    var items = mapItems(filtered.slice(start, start + PAGE_SIZE));
    var next = start + PAGE_SIZE < filtered.length ? String(page + 1) : "";

    return Response.success(items, next);
}
