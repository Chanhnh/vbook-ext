load('config.js');

let apiUrl = api_url.replace(/^"(.*)"$/, '$1');
let contentPath = content_path.replace(/^"(.*)"$/, '$1');

function execute(url) {
    const regex = /(?:item_id=|\/)(\d+)$/;
    let chapid = url.match(regex)[1];

    let chapterUrl = apiUrl + chapid;
    let response = fetch(chapterUrl);

    if (response.ok) {
        let json = response.json();

        // lấy content theo config path
        let rawContent = getByPath(json, contentPath);

        // decode các ký tự unicode escaped
        let content = decodeUnicodeEscapes(rawContent);

        // loại bỏ các thẻ/thành phần không cần thiết
        content = content
            .replace(/<\?xml[^>]*>/gi, "")
            .replace(/<!DOCTYPE[^>]*>/gi, "")
            .replace(/<header[\s\S]*?<\/header>/gi, "")
            .replace(/<h1[\s\S]*?<\/h1>/gi, "")
            .replace(/<blk[^>]*>/gi, "")
            .replace(/<\/blk>/gi, "")
            .replace(/<br\s*\/?>|\n/g, "<br><br>");

        return Response.success(content);
    }

    return Response.error("Lỗi API\nVui lòng cấu hình lại");
}

// Giải mã \u003c -> <, \u003e -> >, ...
function decodeUnicodeEscapes(str) {
    if (!str) return "";
    return str
        .replace(/\\u003c/g, "<")
        .replace(/\\u003e/g, ">")
        .replace(/\\u0026/g, "&")
        .replace(/\\u003d/g, "=");
}

// Cho phép đi sâu nhiều cấp: "data.content"
function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}
