load('config.js');

function execute() {
    let data = [];

    let response = fetch(BASE_URL + "/categories/");
    if (response.ok) {
        let doc = response.html();
        doc.select('.category-list li a').forEach(e => data.push({
            title: e.text(),
            input: e.attr('href')+ "/",
            script: 'gen.js'
        }));
    };

    let tagResponse = fetch(BASE_URL + "/tags/");
    if (tagResponse.ok) {
        let tagDoc = tagResponse.html();
        tagDoc.select('.tag-list li a').forEach(e => data.push({
            title: "#" + e.text(),
            input: e.attr('href') + "/",
            script: 'gen.js'
        }));
    };

    return Response.success(data);
}

