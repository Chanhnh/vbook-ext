load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");
    if (response.ok) {
        let doc = response.html();
        let chapters = [];
        let el = doc.select(".chapter-list")
        el.select("a").forEach(e => {
            chapters.push({
                name: e.select("h4").first().text(),
                url: BASE_URL + e.attr("href"),
                host: BASE_URL
            })
        });
        return Response.success(chapters);
    }
    return null;
}
