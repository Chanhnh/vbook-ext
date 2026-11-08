function execute() {
    return Response.success([
        { title: "最新上架", input: "/newest", script: "search.js" },
        { title: "精选推荐", input: "/recommend", script: "search.js" },
        { title: "AI成人短剧", input: "/ai-duanju/", script: "search.js" },
        { title: "AI成人漫剧", input: "/ai-manju/", script: "search.js" },
        { title: "AI换脸", input: "/ai-huanlian/", script: "search.js" },
        { title: "AI魔改", input: "/ai-mogai/", script: "search.js" },
        { title: "热播榜", input: "/ranks/hot/", script: "search.js" }
    ]);
}
