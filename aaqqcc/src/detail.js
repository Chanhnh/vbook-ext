load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL1);
    let response = fetch(url + "/");
    if (response.ok) {
        let doc = response.html();
        let coverImg = doc.select('div.cover img').attr("src");
        let description = doc.select('div.book-desc').html().replace(/<.*?>.*?<\/.*?>/g, "").trim();
        let novelTitle = doc.select('h1').text();
        let author = doc.select('dl.authors dd a').text();
        let novelCategory = doc.select('dl.categories dd a').text();
        let status = doc.select('dl.status dd').text();
        let updateTime = doc.select('dl.new dd').text();

        return Response.success({
            name: novelTitle,
            cover: coverImg,
            author: author,
            description: novelTitle + ': <br>' + description,
            detail: "Tác giả: " + author + '<br>' + "Thể loại: " + novelCategory + '<br>' + "Tình trạng: " + status + '<br>' + "Thời gian cập nhật: " + updateTime,
            host: BASE_URL || BASE_URL1
        });
    }
    return null;
}
