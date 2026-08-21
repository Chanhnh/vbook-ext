function execute(key) {
    if (key === "login") {
        return Response.error("Nếu có lỗi, vào trang nguồn vượt Cloudflare trước.\nNguồn này cần đăng nhập.\nNhấn vào <Trang nguồn> rồi đăng nhập trên web.\nCần VIP để đọc chương khoá hoặc miễn phí 10 chương/ngày");
    }
    return Response.success([
        { title: "登录", input: "login", script: "home.js" },
        { title: "最新更新", input: "/novel/load?orderType=2", script: "gen.js" },
        { title: "观看量", input: "/novel/load?orderType=3", script: "gen.js" },
        { title: "收藏量", input: "/novel/load?orderType=4", script: "gen.js" },
        { title: "评分", input: "/novel/load?orderType=5", script: "gen.js" },
        { title: "收藏榜", input: "/novel/rank?type=0", script: "gen1.js" },
        { title: "新作榜", input: "/novel/rank?type=1", script: "gen1.js" },
        { title: "月榜", input: "/novel/rank?type=2", script: "gen1.js" }

    ]);
}
