load('config.js');

function execute() {
    let response = fetch(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let genres = [];
    let seen = {};

    function add(title, input) {
        title = String(title || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        input = absUrl(input);
        if (!title || !input || seen[input]) return;
        seen[input] = true;
        genres.push({ title: title, input: input, script: "search.js" });
    }

    doc.select(".hg-topbar-nav a").forEach(function (el) {
        let key = el.attr("data-nav-key");
        if (key.indexOf("video_category") === 0) add(el.text(), el.attr("href"));
    });

    doc.select(".hg-tagrow__item").forEach(function (el) {
        add(el.text(), el.attr("href"));
    });

    return Response.success(genres);
}
