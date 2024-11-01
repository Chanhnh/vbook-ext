load('config.js');

function execute(url) {
    const regex = /(?:item_id=|\/)(\d+)$/;
    let chapid = url.match(regex)[1];
    let chapterUrl = "https://fanqie.gau.us.kg/content?item_id=" + chapid;
    let response_chapter_info = fetch(chapterUrl)
    if (response_chapter_info.ok) {
        let json = response_chapter_info.json();
        let chapter_info = json.data.data.content.replace(/<br\s*\/?>|\n/g, "<br><br>");
        return Response.success(chapter_info);
    }

    return Response.error("Ext lỗi, đang bảo trì hoặc đã cập nhật. Chi tiết đọc ở trang nguồn.");
}
