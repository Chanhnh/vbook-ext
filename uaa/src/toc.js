load('config.js');

function execute(url) {
    url = url.replace(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img,
        BASE_URL
    );

    let response = fetch(url, {
        headers: {
            "user-agent": UserAgent.system()
        }
    });

    if (!response.ok) {
        return null;
    }

    let doc = response.html();
    let chapters = [];

    // Có volume
    let volumes = doc.select('#ndcBody .ndc-vol');

    if (volumes.size() > 0) {
        volumes.forEach(vol => {
            let volumeName = vol.select('.ndc-vol__t').text().trim();

            chapters.push({
                name: "【" + volumeName + "】"
            });

            vol.select('.ndc-row').forEach(a => {
                let acc = a.select('.ndc-acc').text().trim();

                chapters.push({
                    name: a.select('.ndc-name').text().trim(),
                    url: BASE_URL + a.attr('href'),
                    pay: acc.includes("U币"),
                    lock: acc.includes("注册会员"),
                    host: BASE_URL
                });
            });
        });
    }

    // Không có volume
    else {
        doc.select('#ndcBody > .ndc-row').forEach(a => {
            let acc = a.select('.ndc-acc').text().trim();

            chapters.push({
                name: a.select('.ndc-name').text().trim(),
                url: BASE_URL + a.attr('href'),
                pay: acc.includes("U币"),
                lock: acc.includes("注册会员"),
                host: BASE_URL
            });
        });
    }

    return Response.success(chapters);
}