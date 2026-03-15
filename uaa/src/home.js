function execute(key) {
    if (key === "login") {
        return Response.error("Nguồn này cần đăng nhập.\nNhấn vào <Trang nguồn> rồi đăng nhập trên web.\nCần VIP để đọc chương khoá hoặc miễn phí 10 chương/ngày");
    }
    return Response.success([
        { title: "登录", input: "login", script: "home.js" },
        { title: "最新更新", input: "/novel/update", script: "gen.js" },
        { title: "新书上架", input: "/novel/new", script: "gen.js" },
        { title: "热门小说", input: "/novel/hot", script: "gen.js" },
        { title: "月榜", input: "/novel/rank?type=2", script: "gen2.js" },
        { title: "新作榜", input: "/novel/rank?type=1", script: "gen2.js" }

    ]);
}
