load('config.js');

function listUrl(query, page) {
    page = String(parseInt(page, 10) || 1);

    if (query.indexOf("/") !== 0 && query.indexOf("http") !== 0) {
        return BASE_URL + "/search/video/" + encodeURIComponent(query) +
            (page === "1" ? "/" : "/" + page + "/");
    }

    let base = query.indexOf("http") === 0 ? normalizeUrl(query) : BASE_URL + query;
    base = base.replace(/[?#].*$/, "");
    while (base.length > 1 && base.charAt(base.length - 1) === "/") {
        base = base.substring(0, base.length - 1);
    }

    if (page === "1") return base + "/";
    if (base.indexOf("/tag/") !== -1) return base + "/page/" + page + "/";
    return base + "/" + page + "/";
}

function execute(query, page) {
    query = String(query || "").replace(/^\s+|\s+$/g, "");
    page = String(parseInt(page, 10) || 1);

    let response = fetch(listUrl(query, page));
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let scopes = [
        doc.select(".hg-search-results").first(),
        doc.select(".hg-list-page").first()
    ];

    let items = [];
    for (let i = 0; i < scopes.length; i++) {
        if (!scopes[i]) continue;
        items = cardItems(scopes[i]);
        if (items.length > 0) break;
    }
    if (items.length === 0) items = rankItems(doc);
    if (items.length === 0) items = cardItems(doc);

    let next = doc.select("link[rel=next]").attr("href");
    return Response.success(items, next ? String(parseInt(page, 10) + 1) : "");
}
