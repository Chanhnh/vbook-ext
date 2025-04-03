load('config.js');
function execute() {
    let response = fetch(BASE_URL + "/tags");
    if (response.ok) {
        let doc = response.html("gbk");
        const data = [
            {title: "言情小说", input: "/ajax_novels/class/3/{0}.htm", script: "gen.js"},
            {title: "玄幻魔法", input: "/ajax_novels/class/1/{0}.htm", script: "gen.js"},
            {title: "修真武侠", input: "/ajax_novels/class/2/{0}.htm", script: "gen.js"},
            {title: "穿越时空", input: "/ajax_novels/class/11/{0}.htm", script: "gen.js"},
            {title: "都市小说", input: "/ajax_novels/class/9/{0}.htm", script: "gen.js"},
            {title: "历史军事", input: "/ajax_novels/class/4/{0}.htm", script: "gen.js"},
            {title: "游戏竞技", input: "/ajax_novels/class/5/{0}.htm", script: "gen.js"},
            {title: "科幻空间", input: "/ajax_novels/class/6/{0}.htm", script: "gen.js"},
            {title: "悬疑惊悚", input: "/ajax_novels/class/7/{0}.htm", script: "gen.js"},
            {title: "同人小说", input: "/ajax_novels/class/8/{0}.htm", script: "gen.js"},
            {title: "官场职场", input: "/ajax_novels/class/10/{0}.htm", script: "gen.js"},
            {title: "青春校园", input: "/ajax_novels/class/12/{0}.htm", script: "gen.js"},
        ];
        doc.select('.tag a').forEach(e => data.push({
            title: e.text(),
            input: e.attr('href') + "{0}/",
            script: 'gen.js'
        }));
        return Response.success(data);
    }
    return null;
}
