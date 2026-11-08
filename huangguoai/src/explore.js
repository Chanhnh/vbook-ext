load('config.js');

function homeSection(doc, title) {
    let found = null;
    doc.select("section.hg-section").forEach(function (section) {
        let h2 = section.select("h2").first();
        if (!found && h2 && h2.text() === title) found = section;
    });
    return found;
}

function execute() {
    let response = fetch(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let sections = [];

    let banners = [];
    let slidesEl = doc.select("script[data-hero-slides]").first();
    if (slidesEl) {
        try {
            let slides = JSON.parse(slidesEl.html());
            slides.forEach(function (slide) {
                let link = slide.detailHref || slide.href || "";
                if (!link) return;
                banners.push({
                    name: slide.title || "",
                    cover: imgUrl(slide.cover || slide.thumb || ""),
                    link: absUrl(link),
                    description: slide.desc || ""
                });
            });
        } catch (e) {
        }
    }
    if (banners.length > 0) {
        sections.push({ id: "banner", title: "", subtitle: "", type: "banner", items: banners });
    }

    let recommended = homeSection(doc, "精选推荐");
    if (recommended) {
        sections.push({
            id: "recommend",
            title: "精选推荐",
            subtitle: "热门短剧推荐",
            type: "grid",
            items: cardItems(recommended),
            more: { type: "list", name: "精选推荐", script: "search.js", input: "/recommend" }
        });
    }

    let latest = homeSection(doc, "最近上新");
    if (latest) {
        sections.push({
            id: "latest",
            title: "最近上新",
            subtitle: "刚刚更新的短剧",
            type: "grid",
            items: cardItems(latest),
            more: { type: "list", name: "最近上新", script: "search.js", input: "/newest" }
        });
    }

    let rankResponse = fetch(BASE_URL + "/ranks/hot/");
    if (rankResponse.ok) {
        let ranking = rankItems(rankResponse.html());
        if (ranking.length > 0) {
            sections.push({
                id: "ranking",
                title: "热播榜",
                subtitle: "",
                type: "ranking",
                items: ranking,
                more: { type: "list", name: "热播榜", script: "search.js", input: "/ranks/hot/" }
            });
        }
    }

    return Response.success(sections);
}
