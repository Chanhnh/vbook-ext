load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url + "?page=" + page);
    if (response.ok) {
        let doc = response.html();
        const data = [];
        let books = doc.select(".clearfix.rec_rullist");
        books.select("ul").forEach(e => {
            data.push({
                name: e.select("li.two a, li.twosss a").text().replace("全文阅读", ""),
                link: BASE_URL + e.select("li.two a, li.twosss a").attr("href"),
                //cover: e.select("img").first().attr("src"),
                description: e.select("li.four").text(),
                host: BASE_URL
            });
        });
        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}
