load('config.js');
function execute(url) {

    let response = fetch(url);
    if (response.ok) {
        let doc = response.json();
        let rows = doc.book_list||doc.data.list||doc.data.publication_list
        const data = [];
        rows.forEach(e => {
            data.push({
                name: e.book_name||e.bookName,
                author: e.author,
                link: config_host + "/page/" + (e.book_id||e.bookId),
                cover: replaceCover(e.thumb_url||e.thumbUri),
                description: e.abstract||e.author,
                host: config_host
            })
        });
        return Response.success(data);
    }
    return null;
}
