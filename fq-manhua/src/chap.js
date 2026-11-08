load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-image.js');
load('fq-api.js');

function execute(url) {
    try {
        var itemId = fqExtractItemId(url);
        if (!itemId) return Response.error("Không tìm thấy item_id trong URL chương.");
        var device = fqResolveDevice();
        var chapter = fqGetComicChapter(device, itemId);
        return Response.success(chapter.images, chapter.title || "");
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
