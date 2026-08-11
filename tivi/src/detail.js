// detail.js
load('data.js');

function getAllChannels() {
    var all = [];
    var categories = DATA.categories || {};
    for (var cat in categories) {
        if (categories.hasOwnProperty(cat)) {
            var list = categories[cat] || [];
            for (var i = 0; i < list.length; i++) {
                all.push(list[i]);
            }
        }
    }
    return all;
}

function execute(url) {
    var channels = getAllChannels();
    var channel = null;
    for (var i = 0; i < channels.length; i++) {
        if (channels[i].url === url) {
            channel = channels[i];
            break;
        }
    }

    if (!channel) {
        return Response.error("Channel not found");
    }

    return Response.success({
        name: channel.name,
        cover: channel.logo || "",
        author: channel.group || "Tivi",
        description: "Xem kênh " + channel.name + (channel.group ? " (" + channel.group + ")" : ""),
        detail: "Group: " + (channel.group || "Tivi"),
        ongoing: true
    });
}
