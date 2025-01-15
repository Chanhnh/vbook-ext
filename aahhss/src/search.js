load('config.js');
function execute(key, page) {
    const BASE_URL = "https://www.aakkrr.com"; // URL chính của trang tìm kiếm
    // Gửi yêu cầu GET
    let response = fetch(BASE_URL + "/book/" + encodeURIComponent(key));
    if (response.ok) {
        let doc = response.html();
        let books = [];
        // Truy xuất thông tin từ các phần tử có class là grid-item
        doc.select(".grid-item").forEach(e => {
            books.push({
                name: e.select("h3 a").text(), // Tên sách lấy từ thẻ <a> trong <h3>
                link: e.select("a.cover").attr("href"), // Link sách từ thẻ <a class="cover">
                cover: e.select("img").attr("src"), // Link ảnh bìa từ thẻ <img>
                host: BASE_URL
            });
        });
        return Response.success(books); // Trả về danh sách sách
    }
    return null; // Nếu không có kết quả tìm kiếm
}
