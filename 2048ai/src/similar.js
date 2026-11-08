load('config.js');

function execute(input) {
    var id = String(input || "").replace(/[^0-9]/g, "");
    if (!id) return Response.success([], "");

    var list = apiGet("/short-dramas/" + id + "/related?productId=1&limit=12");
    if (!list || !list.length) return Response.success([], "");

    var items = [];
    for (var i = 0; i < list.length; i++) {
        var item = toItem(list[i]);
        if (item && item.name) items.push(item);
    }
    return Response.success(items, "");
}
