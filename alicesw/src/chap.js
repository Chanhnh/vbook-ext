load('config.js');

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let contentElement = doc.select(".read-content.j_readContent.user_ad_content");
        let content = contentElement.html().trim();
        return Response.success(content);
    }
    return null;
}
