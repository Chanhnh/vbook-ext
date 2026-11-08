// Các kênh phân loại của trang 精选 (douyin.com/jingxuan), đúng thứ tự trên site.
// Tiêu đề giữ nguyên tiếng Trung; input là tag_id của API module/feed (xem jingxuan.js).
// Danh sách đọc từ data-tabkey trong HTML SSR của /jingxuan, đã probe thử từng tag_id.
function execute() {
    var channels = [
        { title: "全部", tagId: "" },
        { title: "公开课", tagId: "100000" },
        { title: "游戏", tagId: "300205" },
        { title: "二次元", tagId: "300206" },
        { title: "音乐", tagId: "300209" },
        { title: "影视", tagId: "300215" },
        { title: "美食", tagId: "300204" },
        { title: "知识", tagId: "300213" },
        { title: "小剧场", tagId: "300214" },
        { title: "生活vlog", tagId: "300216" },
        { title: "体育", tagId: "300207" },
        { title: "旅行", tagId: "300221" },
        { title: "亲子", tagId: "300217" },
        { title: "动物", tagId: "300220" },
        { title: "三农", tagId: "300219" },
        { title: "汽车", tagId: "300218" },
        { title: "美妆穿搭", tagId: "300222" }
    ];

    var genres = [];
    for (var i = 0; i < channels.length; i++) {
        genres.push({
            title: channels[i].title,
            input: channels[i].tagId,
            script: "jingxuan.js"
        });
    }
    return Response.success(genres);
}
