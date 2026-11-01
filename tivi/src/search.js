load('lib.js');

function execute(query, page) {
    query = query || "";

    if (query === "@help") {
        return Response.error("Chưa có kênh. Vào Cài đặt → \"Playlist đã lưu (M3U)\" để dán playlist, hoặc thêm URL ở \"Playlist M3U\" rồi bấm \"Làm mới playlist\".");
    }

    var channels = tiviGetChannels();
    if (!channels.length) {
        return Response.error("Chưa có kênh. Vào Cài đặt → \"Playlist đã lưu (M3U)\" để dán playlist, hoặc bấm \"Làm mới playlist\".");
    }

    var result = tiviGetItems(query, page);
    return Response.success(result.items, result.next);
}
