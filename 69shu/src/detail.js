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
    // Định nghĩa regex để lấy ID sách và bỏ 3 chữ số cuối
    const regex_id = /\/(\d+)\.(htm|html)/; // Lấy toàn bộ số
    const regex_id2 = /\/(\d+)(\d{3})\.(htm|html)/; // Bỏ 3 chữ số cuối
    // Lấy book_id và book_id2 từ URL
    let book_id = url.match(regex_id)[1];
    let book_id2 = url.match(regex_id2)[1];
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('gbk');

        return Response.success({
            name: $.Q(doc, 'div.booknav2 > h1 > a').text(),
            cover: `${BASE_URL}/bimages/${book_id2}/${book_id}/${book_id}s.jpg`,
            author: $.Q(doc, 'div.booknav2 > p').text().replace("作者：", "").trim(),
            description: $.Q(doc, 'div.content > p').html(),
            detail: $.QA(doc, 'div.booknav2 p', {m: x => x.text(), j: '<br>'}),
            suggests: [
                {
                    title: "Cùng tác giả",
                    input:"/modules/article/author.php?author="+gbkEncode($.Q(doc, 'div.booknav2 > p').text().replace("作者：", "")),
                    script:"suggest.js"
                }
            ],
            host: BASE_URL
        })
    }
    return null;
}
