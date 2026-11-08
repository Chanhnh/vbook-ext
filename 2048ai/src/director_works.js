load('config.js');

function execute(query, page) {
    var id = String(query || "").replace(/[^0-9]/g, "");
    if (!id) return Response.error("Không tìm thấy ID đạo diễn.");

    page = parseInt(page, 10);
    if (isNaN(page) || page < 1) page = 1;

    var data = apiGet("/short-dramas/directors/" + id + "/works?productId=1&page=" + page + "&size=30");
    if (!data) return Response.error("Không tải được danh sách tác phẩm của đạo diễn.");

    var list = data.items || [];
    var items = [];
    for (var i = 0; i < list.length; i++) {
        var item = toItem(list[i]);
        if (item && item.name) items.push(item);
    }

    var totalPages = parseInt(data.totalPages, 10) || 1;
    return Response.success(items, page < totalPages ? String(page + 1) : "");
}
