load('config.js');

function execute() {
    let data = [];
    let response = fetch(BASE_URL + "/novel/all");
    let doc = response.html();
    if (response.ok) {
        doc.select("div.mb-3 li.mr-3").select('a[href*="theme="]').forEach(e => data.push({
            title: e.text(),
            input: e.attr('href') + "&page=",
            script: 'gen.js'
        }));
        doc.select('div.dx-filter-item ul.flex li').select('a').forEach(e => data.push({
            title: "#" + e.text(),
            input: e.attr('href') + "&page=",
            script: 'gen.js'
        }));
    };
    return Response.success(data);
}

