load('config.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');

function execute(url) {
    try {
        var itemId = fqExtractItemId(url);
        if (!itemId) return Response.error("Không tìm thấy item_id trong URL chương.");
        var device = fqResolveDevice();
        var chapter = fqGetChapter(device, itemId, url);
        return Response.success(chapter.html, chapter.title || "");
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
