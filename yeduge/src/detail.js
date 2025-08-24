load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");
    if (response.ok) {
        let doc = response.html();
        let coverImg = doc.select('div.detail div.cover img').attr("src");
        let novelTitle = doc.select('div.detail div.info h1').text();
        let infoBook = doc.select('div.detail div.info p');
        let author = infoBook.get(0).text().replace("作者：", "").trim();
        let status = infoBook.get(1).text().replace("状态：", "").trim();
        let description = doc.select('div.desc').html()
        let genres = [];
        infoBook.get(2).select('a').forEach(e => genres.push({
            title: e.text(),
            input: e.attr('href') + "/",
            script: "gen.js"
        }));
        infoBook.get(3).select('a').forEach(e => genres.push({
            title: "#" + e.text(),
            input: e.attr('href') + "/",
            script: "gen.js"
        }));
        return Response.success({
            name: novelTitle,
            cover: coverImg,
            author: author,
            description: novelTitle + ': <br>' + description,
            ongoing: status !== "已完结",
            nsfw: true,
            genres: genres,
            suggests: [
                {
                    title: "猜你喜欢",
                    input: doc.select('div.novel-list').html(),
                    script: "suggest.js"
                }
            ],
            host: BASE_URL
        });
    }
    return null;
}
