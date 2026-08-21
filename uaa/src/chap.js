function execute(url) {
    let response = fetch(url, {
        headers: {
            "user-agent": UserAgent.system(),
            "Cookie": ""
        }
    });
    if (response.ok) {
        let doc = response.html();
        let limit = doc.select("script");
        if (limit.html().indexOf("code: 0") == -1)
            return Response.error(Qt.translate(doc.select("div.reader-cap__s.rl-notice").first().text().trim(), "vi", { first_capitalize: true }).translateText);

        let content = "";
        doc.select("div.reader-body").forEach(e => {
            e.select(".pc-bub").remove();
            content = e.select("p").html().trim();
        });
        return Response.success(content);
    }
    return null;
}
