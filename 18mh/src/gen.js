load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let currentUrl = BASE_URL + url + page;
    let response = fetch(currentUrl);

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

