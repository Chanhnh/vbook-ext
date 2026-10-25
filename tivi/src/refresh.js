load('lib.js');

function execute() {
    if (!tiviPlaylistStoreAvailable()) {
        return Response.error("Không truy cập được database của extension để lưu playlist.");
    }

    var urls = tiviGetPlaylistUrls();
    if (!urls.length) {
        return Response.error("Chưa cấu hình playlist M3U. Vào Cài đặt → Playlist M3U để thêm URL .m3u/.m3u8. Dòng thủ công vẫn được giữ nguyên.");
    }

    tiviLog("Tivi: bắt đầu cập nhật " + urls.length + " playlist từ URL...");

    var result = tiviFetchRawPlaylists(urls);
    var saved = 0;
    var channelCount = 0;
    var saveErrors = [];

    for (var i = 0; i < result.playlists.length; i++) {
        var playlist = result.playlists[i];
        if (tiviSaveDownloadedPlaylist(playlist.url, playlist.text)) {
            saved++;
            channelCount += playlist.channels;
        } else {
            saveErrors.push(tiviHostOf(playlist.url) + ": không lưu được vào database");
        }
    }

    if (saved > 0) tiviClearLegacyCache();

    var errors = result.errors.concat(saveErrors);
    if (!saved) {
        var reason = errors.length ? errors.join("; ") : "không có playlist nào được lưu";
        return Response.error("Không cập nhật được playlist nào. Dữ liệu cũ vẫn giữ nguyên. Lỗi: " + reason);
    }

    var message = "Đã cập nhật " + saved + "/" + urls.length + " playlist (" + channelCount + " kênh) từ URL.";
    if (errors.length) {
        message += " Lỗi: " + errors.join("; ");
    }
    return Response.success(message);
}
