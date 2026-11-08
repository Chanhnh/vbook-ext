function execute() {
    return Response.success([
        { title: "Đề xuất", input: "recommend", script: "recommend.js" },
        { title: "Tinh tuyển", input: "jingxuan", script: "jingxuan.js" }
    ]);
}
