load('libs.js');
load('config.js');

function execute(url) {
    var gbkEncode = function(s) {
        load('gbk.js');
        return GBK.encode(s);
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = url.replace("/c/","/b/");
    url = url.replace("/txt/","/book/")
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('gbk');
        let novelTitle = doc.select('meta[property="og:novel:book_name"]').attr("content") || "";
        let cover = doc.select('meta[property="og:image"]').attr("content") || "";
        let newChap = doc.select('meta[property="og:novel:latest_chapter_name"]').attr("content") || "";
        let author = doc.select('meta[property="og:novel:author"]').attr("content") || "";
        let novelCategory = doc.select('meta[property="og:novel:category"]').attr("content") || "";
        let status = doc.select('meta[property="og:novel:status"]').attr("content") || "";
        let updateTime = (doc.select('meta[property="og:novel:update_time"]').attr("content") || "").replace(/\d\d:\d\d:\d\d/g, "");
        let tags = ((doc.select("script").html().match(/tags:\s*'([^']+)'/) || [])[1] || "Không có thẻ").replace(/\|/g, "; ").replace(/;\s*$/, "");
        let genId = (doc.select("script").html().match(/sortId:\s*'(\d+)'/) || [])[1] || "0";
        return Response.success({
            name: novelTitle,
            cover: cover,
            author: author,
            description: doc.select("div.navtxt p").first().html(),
            detail: "Thẻ: " + tags + '<br>' +
                    "Mới nhất: " + newChap + '<br>' +
                    "Thời gian cập nhật: " + updateTime,
            ongoing: status !== "全本",
            genres: [
                {
                    title: novelCategory,
                    input: "/ajax_novels/class/" + genId + "/{0}.htm",
                    script:"gen.js"
                }
            ],
            suggests: [
                {
                    title: "Cùng tác giả",
                    input:"/modules/article/author.php?author=" + gbkEncode(author),
                    script:"suggest.js"
                }
            ],
            host: BASE_URL
        })
    }
    return null;
}
