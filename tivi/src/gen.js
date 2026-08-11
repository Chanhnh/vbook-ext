// gen.js
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

function execute(url, page) {
    var channels = [];
    if (url === "group:all") {
        channels = getAllChannels();
    } else if (url && url.indexOf("group:") === 0) {
        var groupName = url.substring(6);
        channels = DATA.categories[groupName] || [];
    }

    var result = [];
    for (var i = 0; i < channels.length; i++) {
        var chan = channels[i];
        result.push({
            name: chan.name,
            link: chan.url,
            cover: chan.logo || "",
            description: chan.group || ""
        });
    }

    return Response.success(result);
}
