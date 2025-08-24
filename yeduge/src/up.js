load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url);
    if (response.ok) {
        let doc = response.html();
        const data = [];
        let bookLikeSection = doc.select(".novel-list");
        if (bookLikeSection) {
            bookLikeSection.select("a").forEach(e => {
                data.push({
                    name: e.select("h4").first().text(),
                    link: BASE_URL + e.attr("href"),
                    cover: e.select("img").first().attr("data-src"),
                    description: e.select("span").first().text(),
                    host: BASE_URL
                });
            });
        }
        return Response.success(data);
    }
    return null;
}
