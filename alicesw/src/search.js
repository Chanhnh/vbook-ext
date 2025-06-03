load('config.js');
function execute(key, page) {
    let response = fetch(BASE_URL + "/search.html?keyword=" + encodeURIComponent(key));
    if (response.ok) {
        let doc = response.html();
        const data = [];
        let books = doc.select(".clearfix.rec_rullist");
        books.select("ul").forEach(e => {
            data.push({
                name: e.select("li.twosss a").text().replace("全文阅读", ""),
                link: BASE_URL + e.select("li.twosss a").attr("href"),
                //cover:
                description: e.select("li.four").text(),
                host: BASE_URL
            });
        });
        return Response.success(data);
    }
    return null;
}
