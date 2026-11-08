load('config.js');
function execute() {
    try {
        requireLogin();
        return Response.success([
            { title: "Phổ biến", input: "popular", script: "list.js" },
            { title: "Đề xuất", input: "recommend", script: "recommend.js" }
        ]);
    } catch (error) {
        return Response.error(String(error.message || error));
    }
}
