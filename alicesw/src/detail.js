load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");

    if (response.ok) {
        let doc = response.html();
        let novelTitle = doc.select(".novel_title").text();
        let author = doc.select("p").select("a").first().text();
        let updateTime = doc.select(".book_newchap li em").first().text().replace("更新时间：", "").trim().replace(/^(\d{4})-(\d{2})-(\d{2}) (.+)$/, "$3/$2/$1 $4");
        let coverImg = doc.select(".pic img.lazyload_book_cover").attr("src");
        let status = "";
        let detail = [];
        doc.select(".novel_info p").forEach(e => {
            let text = e.text();
            if (text.includes("状 态")) status = text.replace("状 态：", "").trim();
            detail.push(text);
        });

        let genres = [];
        doc.select(".tags_list a.red").forEach(e => {
            genres.push({
                title: e.text(),
                input: e.attr("href"),
                script: "up.js"
            });
        });
        let description = doc.select(".jianjie p").text().trim();

        return Response.success({
            name: novelTitle,
            cover: coverImg,
            author: author,
            description: novelTitle + ': <br>' + description,
            detail:
                detail.join('<br>') + '<br>' +
                "更新时间: " + updateTime,
            ongoing: status.indexOf("连载") !== -1,
            nsfw: true,
            genres: genres,
            suggests: [
                {
                    title: "作者: " + author,
                    input: doc.select("p").select("a").first().attr('href') + "&sort=create_time_DESC",
                    script: "up.js"
                },
            ],
            host: BASE_URL
        });
    }

    return null;
}
