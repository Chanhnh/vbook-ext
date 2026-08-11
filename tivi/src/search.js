// search.js
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

function execute(key, page) {
    var searchKey = (key || "").toLowerCase();
    var allChannels = getAllChannels();
    var result = [];
    
    for (var i = 0; i < allChannels.length; i++) {
        var chan = allChannels[i];
        if (chan.name && chan.name.toLowerCase().indexOf(searchKey) >= 0) {
            result.push({
                name: chan.name,
                link: chan.url,
                cover: chan.logo || "",
                description: chan.group || ""
            });
        }
    }

    return Response.success(result);
}
