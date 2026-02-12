load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");
    if (response.ok) {
    let doc = response.html();
        let cover = doc.select('meta[property="og:image"]').attr("content");
        let name = doc.select("div.ml-3 .dx-title h2").first().text();
        let author = doc.select("div.ml-3 a.underline[href*='author=']").first().text();
        let status = doc.select('div.ml-3 div.text-primary').text().replace("状态：", "").trim();
        let detail = doc.select('div.ml-3').first().html();
        let infoBox = doc.select("div.flex.items-center.justify-between.my-3").first();
            let sex = infoBox.select("div").get(1).text().trim();
            let text = infoBox.select("div").get(2).text().trim();
            let view = infoBox.select("div").get(3).text().trim();
        let description = doc.select('meta[name="description"]').attr("content").replace("- 最好看的小说免费看。兄弟们！热门小说又来啦～都市激情、校园恋情等，全都给你打包好！独家内容天天有，看的保证让你欲罢不能。", ":<br>");
        let genres = [];
        doc.select("div.ml-3 div.line-clamp-1 a").forEach(e => {
            genres.push({
                title: e.text(),
                        input: e.attr("href"),
                        script: "gen.js"
            });
        });
        doc.select("div.mt-2 div.mb-2 a.underline[href*='/novel/tag/']").forEach(e => {
            let title = e.text().trim();
            genres.push({
                title: title,
                input: e.attr("href") + "/",
                        script: "gen.js"
            });
        });
        return Response.success({
            name: name,
            cover: cover,
            author: author,
            detail: detail + "<br>Sex: " + sex + "<br>Text: " + text + "<br>View: " + view,
            description: description,
            ongoing: status !== "已完结",
            nsfw: true,
            genres: genres,
            suggests: [
                {
                    title: author,
                    input: doc.select("div.ml-3 a.underline[href*='author=']").first().attr("href"),
                    script: "author.js"
                }
            ],
            host: BASE_URL
        });
    }
    return null;
}
