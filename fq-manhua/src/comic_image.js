load('fq-crypto.js');
load('fq-gcm.js');
load('fq-image.js');

function fqComicImageHeaders() {
    return {
        "User-Agent": UserAgent.chrome(),
        "Referer": "https://fanqienovel.com/"
    };
}

function fqComicFetchLatin1(info) {
    var response = fetch(info.url, {
        headers: fqComicImageHeaders(),
        timeout: 60000
    });
    if (!response.ok) throw new Error("Không tải được ảnh (HTTP " + response.status + ").");
    var text = response.text("iso-8859-1");
    if (!text || text.length < 28) return null;
    return fqLatin1Bytes(text);
}

function fqComicFetchBase64(info) {
    var response = fetch(info.url, {
        headers: fqComicImageHeaders(),
        timeout: 60000
    });
    if (!response.ok) throw new Error("Không tải được ảnh (HTTP " + response.status + ").");
    return fqB64Decode(response.base64());
}

function execute(link) {
    var info = fqComicImageInfo(link);
    if (!info.key) throw new Error("Ảnh thiếu khóa giải mã.");
    var encrypted = null;
    try {
        encrypted = fqComicFetchLatin1(info);
    } catch (e) {
        encrypted = null;
    }
    var plain = null;
    if (encrypted) {
        try {
            plain = fqComicDecryptImage(encrypted, info.key, info.md5);
        } catch (e) {
            plain = null;
        }
    }
    if (!plain) {
        encrypted = fqComicFetchBase64(info);
        plain = fqComicDecryptImage(encrypted, info.key, info.md5);
    }
    return fqB64Encode(plain);
}
