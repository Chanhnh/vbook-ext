function execute(url) {
    let response = fetch(url, {
        headers: {
            "user-agent": UserAgent.system(),
            "Cookie": ""
        }
    });
    if (response.ok) {
        let doc = response.html();
        let article = doc.select("div.article").first();
        if (article.attr("code") != "0")
            return Response.error(doc.select("#notice").text().trim());
        let htm = "";
        doc.select("div.article div.line").forEach(e => {
            let line = e.html().trim();
            if (line) {
                htm += "<p>" + line + "</p>";
            }
        });
        return Response.success(htm);
    }
    return null;
}
