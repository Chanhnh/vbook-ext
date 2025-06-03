load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");

    if (response.ok) {
        let doc = response.html();
        let novelTitle = doc.select("h1.f20h").text();
        let author = doc.select("p").select("a").first().text();
        let newChapEl = doc.select("p").select("a").get(1);
        let newChap = newChapEl ? newChapEl.text() : "";
        let updateTime = doc.select("div[style^=float:right]").text().replace("更新时间：", "").trim().replace(/^(\d{4})-(\d{2})-(\d{2}) (.+)$/, "$3/$2/$1 $4");
        let coverImg = doc.select(".pic img.lazyload_book_cover").attr("src");
        let status = "";
        let detail = [];
        doc.select(".tLJ").forEach(e => {
            let text = e.text();
            if (text.includes("小说状态")) status = text.replace("小说状态：", "").trim();
            detail.push(text);
        });

        let genres = [];
        doc.select("p a.red").forEach(e => {
            genres.push({
                title: e.text(),
                input: e.attr("href"),
                script: "gen.js"
            });
        });
        let description = doc.select("div.intro").text().trim();

        return Response.success({
            name: novelTitle,
            cover: coverImg,
            author: author,
            description: novelTitle + ': <br>' + description,
            detail:
                detail.join('<br>') + '<br>' +
                "最新章节: " + newChap + '<br>' +
                "更新时间: " + updateTime,
            ongoing: status.indexOf("连载") !== -1,
            nsfw: true,
            genres: genres,
            suggests: [
                {
                    title: "作者: " + author,
                    input: doc.select("p").select("a").first().attr('href'),
                    script: "gen.js"
                },
            ],
            host: BASE_URL
        });
    }

    return null;
}
