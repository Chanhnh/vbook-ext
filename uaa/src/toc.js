load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let chapters = [];
        // dạng có volume
        if (doc.select(".catalog_ul li.volume").size() > 0) {
            doc.select(".catalog_ul > li.volume").forEach(vol => {
                let volumeName = vol.select("span").first().text().trim();
                chapters.push({
                    name: "【" + volumeName + "】"
                });
                vol.select("ul.children li.child").forEach(li => {
                    let a = li.select("a").first();
                    chapters.push({
                        name: a.text().replace("new 最新章节VIP优先看", "(VIP)").trim(),
                        url: BASE_URL + a.attr("href"),
                        pay: li.select("> span").text().includes("U币"),
                        lock: li.select("> span").text().includes("注册会员") || a.select(".new").size() > 0,
                        host: BASE_URL
                    });
                });
            });
        }
        // dạng không volume
        else {
            doc.select(".catalog_ul li.menu").forEach(li => {
                let a = li.select("a").first();
                chapters.push({
                    name: a.text().replace("new 最新章节VIP优先看", "(VIP)").trim(),
                    url: BASE_URL + a.attr("href"),
                    pay: li.select("> span").text().includes("U币"),
                    lock: li.select("> span").text().includes("注册会员") || a.select(".new").size() > 0,
                    host: BASE_URL
                });
            });
        }
        return Response.success(chapters);
    }
    return null;
}
