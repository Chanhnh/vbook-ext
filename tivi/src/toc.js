// toc.js
load('data.js');

function execute(url) {
    var title = "Xem Trực Tiếp";
    var categories = (DATA && DATA.categories) ? DATA.categories : {};
    for (var cat in categories) {
        if (categories.hasOwnProperty(cat)) {
            var list = categories[cat] || [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].url === url) {
                    if (list[i].name) {
                        title = "Xem " + list[i].name;
                    }
                    break;
                }
            }
        }
    }
    return Response.success([{
        name: title,
        url: url
    }]);
}
