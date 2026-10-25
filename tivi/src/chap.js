function execute(url) {
    url = (url || "").replace(/^\s+|\s+$/g, "");
    if (!url) return Response.error("Thiếu URL kênh.");
    return Response.success([
        { title: "Luồng trực tiếp", data: url }
    ]);
}
