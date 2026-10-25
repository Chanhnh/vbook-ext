load('lib.js');

function execute() {
    var groups = tiviGetCategories();
    var genres = [];

    if (groups.length) {
        genres.push({ title: "📺 Tất cả", input: "group:", script: "search.js" });
    }

    for (var i = 0; i < groups.length; i++) {
        genres.push({
            title: groups[i],
            input: "group:" + groups[i],
            script: "search.js"
        });
    }

    return Response.success(genres);
}
