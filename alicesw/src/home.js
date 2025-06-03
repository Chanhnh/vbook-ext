function execute() {
    return Response.success([
        { title: "用户登录", input: "https://www.alicesw.com/user/user/login.html", script: "" },
        { title: "原创专区", input: "/original.html", script: "gen.js" },
        { title: "更新", input: "/all/order/update_time+desc.html", script: "gen.js" },
        { title: "总排行", input: "/other/rank_hits/order/hits.html", script: "gen.js" },
        { title: "本月排行", input: "/other/rank_hits/order/hits_month.html", script: "gen.js" },
        { title: "本周排行", input: "/other/rank_hits/order/hits_week.html", script: "gen.js" },
        { title: "本日排行", input: "/other/rank_hits/order/hits_day.html", script: "gen.js" },
        { title: "字数", input: "/all/order/word+desc.html", script: "gen.js" }
    ]);
}

