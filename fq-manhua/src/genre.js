load('config.js');
load('fq-sha512.js');
load('fflate.js');
load('fq-crypto.js');
load('fq-api.js');
load('fq-catalog.js');

function execute() {
    try {
        return Response.success(fqComicGenres(fqResolveDevice()));
    } catch (e) {
        return Response.error(fqErrorMessage(e));
    }
}
