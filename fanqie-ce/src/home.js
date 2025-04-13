function execute() {
    return Response.success([
        {title: "Trang nguồn", input: "", script:""},
        {title: "巅峰榜",input: "https://fanqienovel.com/api/author/misc/top_book_list/v1/?limit=30&offset=0", script: "gen.js"},
        {title: "出版",input: "https://fanqienovel.com/api/node/publication/list?page_index=0&page_count=30", script: "gen.js"},
        {title: "精选",input: "https://fanqienovel.com/api/rank/recommend/list?type=1&limit=30&offset=0", script: "gen.js"},
        {title: "男频精选",input: "https://fanqienovel.com/api/rank/recommend/list?type=2&limit=30&offset=0", script: "gen.js"},
        {title: "女频精选",input: "https://fanqienovel.com/api/rank/recommend/list?type=3&limit=30&offset=0", script: "gen.js"}
    ]);
}
