load('config.js');

function execute() {
    let data = [];

    let response = fetch(BASE_URL + "/category/");
    if (response.ok) {
        let doc = response.html();

        doc.select('.top-grid-list a').forEach(e => data.push({
            title: e.select('h4').text(),
            input: '/category/' + e.attr('href') +'/',
            script: 'gen.js'
        }));

        let tagPages = [
            '/tag/index.html',
            '/tag/index_2.html',
            '/tag/index_3.html',
            '/tag/index_4.html'
        ];

        tagPages.forEach(page => {
            let tagResponse = fetch(BASE_URL + page);
            if (tagResponse.ok) {
                let tagDoc = tagResponse.html();
                tagDoc.select('.top-grid-list a').forEach(e => data.push({
                    title: e.select('h4').text(),
                    input: '/tag/' + e.attr('href') + '/',
                    script: 'gen.js'
                }));
            }
        });

        return Response.success(data);
    }
    return null;
}
