load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let info = videoInfo(url);
    let pageUrl = info ? BASE_URL + "/video/" + info.id + "/" : url;

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let name = doc.select(".hg-web-play__title").text();
    if (!name) {
        let h1 = doc.select("h1").first();
        name = h1 ? h1.text() : "";
    }

    let coverImg = doc.select(".hg-web-play__poster img").first();
    let cover = coverImg ? (coverImg.attr("data-src") || coverImg.attr("src")) : "";

    let description = doc.select(".hg-web-play__synopsis-text p").text();
    if (!description) description = doc.select("meta[name=description]").attr("content");

    let facts = [];
    let author = "";
    let status = "";
    let score = doc.select("span[data-rate-score]").text().replace(/[^0-9.]/g, "");
    if (score) facts.push("综合评分：" + score + " 分");
    doc.select(".hg-web-play__fact").forEach(function (el) {
        let label = el.select("b").text();
        let value = el.select("span").text().replace(/\+关注/g, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (label === "出品") author = value;
        if (label === "更新状态") status = value;
        if (label && value) facts.push(label + "：" + value);
    });

    let tags = doc.select(".hg-web-play__tags a").map(function (el) {
        return { title: el.text(), input: el.attr("href"), script: "search.js" };
    });

    let genres = [];
    let breadcrumbs = doc.select(".hg-breadcrumb a");
    if (breadcrumbs.size() > 1) {
        let category = breadcrumbs.get(1);
        let categoryInput = category.attr("href");
        if (categoryInput && categoryInput !== "/") {
            genres.push({ title: category.text(), input: categoryInput, script: "search.js" });
        }
    }

    let suggests = [];
    if (doc.select("#related-grid").first()) {
        suggests.push({ title: "猜你喜欢", input: pageUrl, script: "similar.js" });
    }

    let comments = [];
    let videoId = doc.select("[data-track-video-id]").attr("data-track-video-id");
    let episode = doc.select("[data-track-episode]").attr("data-track-episode");
    if (!episode) episode = info ? info.ep : "1";
    if (videoId) {
        comments.push({
            title: "评论",
            input: "/api/videos/" + videoId + "/comments?ep=" + episode,
            script: "comments.js"
        });
    }

    return Response.success({
        name: name,
        author: author,
        cover: imgUrl(cover),
        description: description,
        detail: facts.join("\n"),
        url: pageUrl,
        type: "video",
        format: "series",
        ongoing: status ? status.indexOf("更新") !== -1 : true,
        nsfw: true,
        locale: "zh-CN",
        tags: tags,
        genres: genres,
        suggests: suggests,
        reviews: [],
        comments: comments
    });
}
