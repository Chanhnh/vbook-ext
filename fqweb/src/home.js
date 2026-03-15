function execute(key) {

    if (key === "caution") {
        return Response.error("Chỉ dùng được trên vBook beta\nDành cho mục đích phát triển\nCần tham khảo ý kiến các chiên da để sử dụng\nCấu hình các thông tin API trong phần <Cài đặt> ext trước khi sử dụng");
    }
    return Response.success([
        { title: "注意", input: "caution", script: "home.js" },
        { title: "巅峰榜", input: "https://fanqienovel.com/api/author/misc/top_book_list/v1", script: "gen.js" },
        { title: "出版", input: "https://fanqienovel.com/api/node/publication/list?page_index={{page}}&page_count=18", script: "gen.js" },
        { title: "最热", input: "https://fanqienovel.com/api/author/library/book_list/v0/?page_count=18&page_index={{page}}&gender=-1&category_id=-1&creation_status=-1&word_count=-1&book_type=-1&sort=0", script: "gen.js" },
        { title: "最新", input: "https://fanqienovel.com/api/author/library/book_list/v0/?page_count=18&page_index={{page}}&gender=-1&category_id=-1&creation_status=-1&word_count=-1&book_type=-1&sort=1", script: "gen.js" },
        { title: "最新已完结", input: "https://fanqienovel.com/api/author/library/book_list/v0/?page_count=18&page_index={{page}}&gender=-1&category_id=-1&creation_status=0&word_count=-1&book_type=-1&sort=1", script: "gen.js" },
        { title: "最热短篇小说", input: "https://fanqienovel.com/api/author/library/book_list/v0/?page_count=18&page_index={{page}}&gender=-1&category_id=-1&creation_status=0&word_count=0&book_type=-1&sort=0", script: "gen.js" }
    ]);
}
