load('config.js');

function execute(input) {
    input = String(input || "");
    let doc;

    if (input.indexOf("<") === 0) {
        doc = Html.parse(input);
    } else {
        let url = normalizeUrl(input);
        if (url.indexOf("http") !== 0) url = absUrl(url);
        let response = fetch(url);
        if (!response.ok) return Response.error("HTTP " + response.status);
        doc = response.html();
    }

    let root = doc.select("#related-grid").first();
    if (!root) root = doc;
    return Response.success(cardItems(root), "");
}
