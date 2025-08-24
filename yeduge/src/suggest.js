load("config.js");
function execute(input) {
    let doc = Html.parse(input);
    let books = [];
    doc.select("a").forEach(book => {
        books.push({
            name: book.select("h4").text(),
            link: BASE_URL + book.attr("href"),
            cover: book.select("img").attr("data-src"),
            description: book.select("span").text(),
            host: BASE_URL
        })
    });
    return Response.success(books);
}
