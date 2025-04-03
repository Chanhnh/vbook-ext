load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url + "/");
    if (response.ok) {
        let doc = response.html();
        let coverImg = doc.select('div.cover img').attr("src");
        let description = doc.select('div.book-desc').html().replace(/<.*?>.*?<\/.*?>/g, "").trim();
        let novelTitle = doc.select('h1').text();
        let author = doc.select('dl.authors dd a').text();
        let status = doc.select('dl.status dd').text();
        let pornrate = doc.select('dl.pornrate dd').text();
        let wordcount = doc.select('dl.wordcount dd').text();
        let newChap = doc.select('dl.new dd a').text();
        let updateTime = doc.select("dl.new dd").text().replace(newChap, "").trim();
        let tags = [];
            doc.select(".book-desc .tag a").forEach(e => tags.push(e.text()));
            tags = tags.join("; ");
        let genres = [];
            doc.select('dl.categories dd a').forEach(e => genres.push({
                    title: e.text(),
                    input: e.attr('href') + "/",
                    script: "gen.js"
            }));
        return Response.success({
            name: novelTitle,
            cover: coverImg,
            author: author,
            description: novelTitle + ': <br>' + description,
            detail: "Thẻ: " + tags + '<br>' +
                    "Sếch: " + pornrate + '<br>' +
                    "Lượng chữ: " + wordcount + '<br>' +
                    "Mới nhất: " + newChap + '<br>' +
                    "Thời gian cập nhật: " + updateTime,
            ongoing: status !== "已完结",
            genres: genres,
            suggests: [
                {
                    title: "Cùng tác giả",
                    input: doc.select('dl.authors dd a').attr('href'),
                    script:"suggest.js"
                }
            ],
            host: BASE_URL
        });
    }
    return null;
}
