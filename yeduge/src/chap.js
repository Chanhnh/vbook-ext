function execute(url) {

    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let htm = doc.select('div.content').html();
        return Response.success(htm);
    }
    return null;
}
