load("config.js");
function execute(input) {
    let doc = Html.parse(input);
    let books = [];
    doc.select("a").forEach(book => {
        books.push({
            name: book.select("h4").text() || book.text(),
            link: BASE_URL + book.attr("href"),
            cover: book.select("img").attr("src"),
            author: book.select("span").text(),
            host: BASE_URL
        })
    });
    return Response.success(books);
}
