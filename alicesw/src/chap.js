function execute(url) {
    var browser = Engine.newBrowser();
    browser.launchAsync(url);
    sleep(2000);
    doc = browser.html();
    browser.close();
    var content = doc.select(".content_txt").html();
    return Response.success(content);
}
