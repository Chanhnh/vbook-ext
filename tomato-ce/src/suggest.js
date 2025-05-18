load("config.js");
function execute(input) {
    let response = fetch(input);
    if (response.ok) {
        let doc = response.json();
        let booksList = doc.data.author_book_info;
        let books = [];
        booksList.forEach(book => {
            books.push({
                name: book.book_name,
                link: config_host + "/page/" + book.book_id,
                cover: replaceCover(book.thumb_url),
                author: book.author,
                description: book.abstract,
                host: config_host
            });
        });
        return Response.success(books);
    }
    return null;
}
