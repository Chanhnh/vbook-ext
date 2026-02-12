function execute() {
    return Response.success([
        { title: "Anti DDOS", input: "", script: "" },
        { title: "全部小说", input: "/novel/all/page/", script: "gen.js" },
        { title: "热门小说", input: "/novel/hot/page/", script: "gen.js" },
        { title: "最新上架", input: "/novel/last_published/page/", script: "gen.js" },
        { title: "最新更新", input: "/novel/newest/page/", script: "gen.js" }
    ]);
}
