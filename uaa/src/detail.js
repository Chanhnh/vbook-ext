load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let id = url.match(/id=(\d+)/)[1];
    let response = fetch(url, {
        headers: {
            "user-agent": UserAgent.system()
        },
    });

    if (response.ok) {
        let doc = response.html();
        let cover = doc.select('.nd-cover img').attr('src');
        let name = doc.select('.nd-info h1').text()
            .replace(doc.select('.nd-fr-inline').text(), '').trim();
        let author = doc.select('.nd-author__lk').text().trim();
        let status = doc.select('.nd-tag--live').text().trim();
        let score = doc.select('.nd-score b').text().trim();
        let latest = doc.select('.nd-latest').text().trim();
        let stats = doc.select('.nd-stats .nd-stat');

        let view = "";
        let like = "";
        let text = "";
        stats.forEach(function (e) {
            let value = e.select('.n').text().trim();
            let label = e.select('.l').text().trim();
            if (label === "观看量") {
                view = value;
            } else if (label === "收藏量") {
                like = value;
            } else if (label === "字数") {
                text = value;
            }
        });

        let description = doc.select('.nd-synopsis').text().trim();
        let genres = [];
        doc.select('#ndTags a').forEach(e =>
            genres.push({
                title: e.text().replace(e.select('em').text(), '').trim(),
                input: e.attr('href'),
                script: "gen1.js"
            })
        );

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            detail: latest +
                "<br>评分：" + score +
                "<br>状态：" + status +
                "<br>观看量：" + view +
                "<br>收藏量：" + like +
                "<br>字数：" + text,
            description: description,
            ongoing: status !== "已完结",
            nsfw: true,
            genres: genres,
            suggests: [{
                title: Qt.translate(author, "hv", { first_capitalize: true }).translateText,
                input: "/novel/load?author=" + author,
                script: "gen.js"
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
