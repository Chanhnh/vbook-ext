load('lib.js');

function execute() {
    var channels = tiviGetChannels();
    if (!channels || channels.length === 0) {
        return Response.success([
            {
                title: "⚙️ Chưa có kênh — thêm playlist",
                input: "@help",
                script: "search.js"
            }
        ]);
    }

    var groups = tiviGetCategories();
    var tabs = [
        { title: "📺 Tất cả", input: "group:", script: "search.js" }
    ];

    var limit = Math.min(groups.length, TIVI_HOME_GROUP_LIMIT);
    for (var i = 0; i < limit; i++) {
        tabs.push({
            title: groups[i],
            input: "group:" + groups[i],
            script: "search.js"
        });
    }

    return Response.success(tabs);
}
