load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let info = videoInfo(url);
    let pageUrl = info ? BASE_URL + "/video/" + info.id + "/" : url;

    let response = fetch(pageUrl);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let episodes = [];
    doc.select(".hg-web-play__ep-grid a.hg-web-play__ep").forEach(function (el) {
        let name = el.text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (!name) name = el.attr("data-ep-id") || "";
        let link = absUrl(el.attr("href"));
        if (!link) return;
        episodes.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (episodes.length === 0) {
        episodes.push({ name: "正片", url: pageUrl, description: "", lock: false, pay: false });
    }

    return Response.success(episodes);
}
