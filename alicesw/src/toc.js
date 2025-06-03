load('config.js');

function execute(url) {
    const regex = /\/(\d+)\.html/;
    const match = url.match(regex);
    let book_id = match[1];
    console.log(book_id)
    let response = fetch(BASE_URL + "/other/chapters/id/" + book_id +".html");
    if (response.ok) {
        let doc = response.html();
        let chapters = [];
        let el = doc.select(".mulu_list")
        el.select("a").forEach(e => {
            chapters.push({
                name: e.text().trim(),
                url: BASE_URL + e.attr("href"),
                host: BASE_URL
            })
        });
        return Response.success(chapters);
    }
    return null;
}
