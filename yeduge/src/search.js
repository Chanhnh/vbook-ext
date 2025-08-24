load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/search/?q=" + encodeURIComponent(key) + "&page=" + page);
    if (response.ok) {
        let doc = response.html();
        let books = [];

        doc.select(".novel-item").forEach(e => {
            books.push({
                name: e.select("a.title").text(),
                link: e.select("a.title").attr("href"),
                cover: e.select("img").first().attr("data-src"),
                author: e.select("span").text(),
                description: e.select("p.desc").html(),
                host: BASE_URL
            });
        });
        let next = (parseInt(page) + 1).toString();
        return Response.success(books, next);
    }
    return null;
}
