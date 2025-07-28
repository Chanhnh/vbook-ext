load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/search.html?q=" + encodeURIComponent(key) + "&f=title&p=" + page);
    if (response.ok) {
        let doc = response.html();
        const data = [];
        let books = doc.select(".list-group .list-group-item");
        books.forEach(e => {
            data.push({
                name: e.select("h5 a").text().replace(/^\d+\.\s/, ""),
                link: BASE_URL + e.select("h5 a").attr("href"),
                //cover:
                description: e.select("p.content-txt").text(),
                host: BASE_URL
            });
        });
        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}
