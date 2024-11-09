load('libs.js');
load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = url.replace("/c/","/b/")
    // Định nghĩa regex để lấy ID sách và 2 chữ số đầu tiên
    const regexFull = /\/(\d+)\.html/; // Lấy toàn bộ số
    const regexTwoDigits = /\/(\d{2})\d+\.html/; // Lấy 2 chữ số đầu tiên
    // Lấy book_id và book_id2 từ URL
    let book_id = url.match(regexFull)[1];
    let book_id2 = url.match(regexTwoDigits)[1];
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('gbk');

        return Response.success({
            name: $.Q(doc, 'div.booknav2 > h1 > a').text(),
            cover: `${BASE_URL}/bimages/${book_id2}/${book_id}/${book_id}s.jpg`,
            author: $.Q(doc, 'div.booknav2 > p').text().replace("作者：", "").trim(),
            description: $.Q(doc, 'div.content > p').html(),
            detail: $.QA(doc, 'div.booknav2 p', {m: x => x.text(), j: '<br>'}),
            host: BASE_URL
        })
    }
    return null;
}
