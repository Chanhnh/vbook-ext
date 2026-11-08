function execute() {
    return Response.success([
        { title: "漫画精选", input: JSON.stringify({ mode: "comic", feed: true }), script: "gen.js" }
    ]);
}
