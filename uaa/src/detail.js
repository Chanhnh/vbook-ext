load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let id = url.match(/id=(\d+)/)[1];
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let cover = doc.select('div.novel_box img.cover').attr("src");
        let name = doc.select('div.info_box h1').text();
        let status = doc.select('.update_state').text().replace("状态：", "").trim();
        let detail = doc.select('div.item:contains(最新：)').text() + "<br>" +
            doc.select('div.item:contains(来源：)').text() + "<br>" +
            doc.select('div.item:contains(评分：)').text();
        let infoBox = doc.select("div.props_box li");
        let sex = infoBox.get(0).text().trim();
        let text = infoBox.get(1).text().trim();
        let view = infoBox.get(2).text().trim();
        let like = infoBox.get(3).text().trim();
        let author = doc.select('div.item:contains(作者) a').text().trim();
        let description = doc.select('meta[name="description"]').attr("content");
        let genres = [];
        doc.select('a[href*="category="]').forEach(e =>
            genres.push({
                title: e.text(),
                input: e.attr('href'),
                script: "gen1.js"
            })
        );
        doc.select('.tag_box a').forEach(e =>
            genres.push({
                title: e.text(),
                input: e.attr('href'),
                script: "gen1.js"
            })
        );
        return Response.success({
            name: name,
            cover: cover,
            author: author,
            detail: detail + "<br>Sex: " + sex + "<br>Text: " + text + "<br>View: " + view + "<br>Like: " + like,
            description: description,
            ongoing: status !== "已完结",
            nsfw: true,
            genres: genres,
            suggests: [{
                title: author,
                input: doc.select('div.item:contains(作者) a').attr("href"),
                script: "gen1.js"
            }],
            comment: {
                input: "/api/novel/app/novel/comments?novelId=" + id + "&sortType=1",
                script: "comment.js"
            },
            host: BASE_URL
        });
    }
    return null;
}
