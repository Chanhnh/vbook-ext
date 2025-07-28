load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(BASE_URL + url + "&p=" + page);
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
