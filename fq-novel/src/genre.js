load("config.js");
function execute() {
    let response = fetch("https://fanqienovel.com/api/author/book/category_list/v0");
    let data = response.json().data;

    let genres = [];
    data.forEach((e) => {
        genres.push({
            title: e.name,
            input: "https://fanqienovel.com/api/author/library/book_list/v0/?category_id=" + e.category_id + "&book_type=-1&page_count=18&page_index={{page}}",
            script: "gen.js",
        });
    });

    return Response.success(genres);
}
