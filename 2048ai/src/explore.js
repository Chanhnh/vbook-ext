load('config.js');

function mapDramas(list) {
    var items = [];
    if (!list) return items;
    for (var i = 0; i < list.length; i++) {
        var item = toItem(list[i]);
        if (item && item.name) items.push(item);
    }
    return items;
}

function execute() {
    var home = apiGet("/short-dramas/home?productId=1");
    var sections = [];

    if (home) {
        var featured = mapDramas(home.featured);
        if (featured.length) {
            sections.push({
                id: "featured",
                title: "精选短剧",
                subtitle: "2048 AI短剧推荐",
                type: "grid",
                shape: "book",
                items: featured,
                more: { type: "list", name: "最新短剧", script: "search.js", input: "sort:latest" }
            });
        }

        var chaseRank = mapDramas(home.chaseRank);
        if (chaseRank.length) {
            sections.push({
                id: "chaseRank",
                title: "追剧榜",
                subtitle: "热门短剧 · 完整榜单",
                type: "ranking",
                shape: "book",
                items: chaseRank,
                more: { type: "list", name: "完整榜单", script: "search.js", input: "rank" }
            });
        }

        var banner = mapDramas(home.banner);
        if (banner.length) {
            sections.push({
                id: "banner",
                title: "热门推荐",
                type: "horizontal_list",
                shape: "book",
                items: banner
            });
        }
    }

    var directors = apiGet("/short-dramas/directors?productId=1&sortBy=popular&page=1&size=10");
    if (directors && directors.items && directors.items.length) {
        var directorItems = [];
        for (var i = 0; i < directors.items.length; i++) {
            var director = directors.items[i];
            var tags = [];
            if (director.workCount) tags.push(director.workCount + "部作品");
            if (director.followers) tags.push(formatCount(director.followers) + "关注");

            var directorName = cleanTitle(director.name) || ("导演 " + director.id);

            directorItems.push({
                name: directorName,
                cover: absoluteUrl(director.avatarUrl),
                description: director.signature || "",
                tag: tags.join(" · "),
                action: {
                    type: "list",
                    name: directorName || "作品",
                    script: "director_works.js",
                    input: String(director.id)
                }
            });
        }

        sections.push({
            id: "directors",
            title: "2048签约导演",
            subtitle: "官方签约创作者 · 每周更新",
            type: "horizontal_list",
            shape: "circle",
            items: directorItems
        });
    }

    if (!sections.length) return Response.error("Không tải được trang khám phá phim ngắn.");
    return Response.success(sections);
}
