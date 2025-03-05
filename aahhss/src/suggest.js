load("config.js");
function execute(input, page) {
    let response = fetch(BASE_URL + input);
    if (response.ok) {
        let doc = response.html();
        // Lấy danh sách sách trong phần .book-like
        let booksList = doc.select(".book-like a");
        let books = [];
        booksList.forEach(book => {
            books.push({
                name: book.select("h4").text(),  // Lấy tên sách từ thẻ <h4>
                link: BASE_URL + book.attr("href"),        // Lấy đường dẫn sách
                cover: book.select("img").attr("src"), // Lấy ảnh bìa từ thẻ <img>
                author: book.select("span").text(), // Lấy tên tác giả từ thẻ <span>
                host: BASE_URL
            });
        });
        // Lấy link trang tiếp theo nếu có
        let nextElement = doc.select(".next").first();
        let next = nextElement ? nextElement.attr("href") : null;
        return Response.success(books, next);
    }
    return null;
}
