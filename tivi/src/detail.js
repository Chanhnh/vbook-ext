load('lib.js');

function execute(url) {
    url = url || "";
    var channel = tiviFindChannel(url);
    if (!channel) {
        return Response.error("Kênh không còn trong dữ liệu đã lưu. Kiểm tra Cài đặt → \"Playlist đã lưu (M3U)\" hoặc bấm \"Làm mới playlist\".");
    }

    var groups = tiviGroupsOf(channel);
    var tags = [];
    for (var i = 0; i < groups.length; i++) {
        tags.push({
            title: groups[i],
            input: "group:" + groups[i],
            script: "search.js"
        });
    }

    return Response.success({
        name: channel.name,
        author: groups.join(", "),
        cover: channel.logo || "",
        description: "Kênh " + channel.name + " — nhóm " + groups.join(", "),
        detail: "Nhóm: " + groups.join(", ") + "\nNguồn: " + tiviHostOf(channel.url),
        url: channel.url,
        type: "video",
        format: "stream",
        ongoing: true,
        locale: "vi",
        nsfw: false,
        tags: tags
    });
}
