function execute() {
    return Response.success([
        { title: "Anti DDOS", input: "", script: "" },
        { title: "最新小说", input: "/rank/new/", script: "up.js" },
        { title: "人气排行", input: "/rank/hot/", script: "up.js" },
        { title: "完本小说", input: "/rank/complete/", script: "up.js" },
        { title: "免费小说", input: "/rank/free/", script: "up.js" }
    ]);
}
