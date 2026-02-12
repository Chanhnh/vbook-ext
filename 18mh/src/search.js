load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/novel/search/" + page + "?key_word=" + encodeURIComponent(key));
    if (response.ok) {
        let doc = response.html();
        const data = [];
        doc.select(".index-content ul.dx-novel-list li").forEach(e => {
            let a = e.select("a[href]").first();
            let cover = [];
            cover.push({
                link: a.select("img").attr("data-src"),
                script: "image.js"
            });
            data.push({
                name: e.select("h3").text().trim(),
                link: a.attr("href"),
                cover: cover,
                //description: ,
                host: BASE_URL
            });
        });
        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}
