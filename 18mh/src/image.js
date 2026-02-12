load('crypto.js');

const CRYPTO_CONFIG = {
    key: CryptoJS.enc.Utf8.parse('f5d965df75336270'),
    iv: CryptoJS.enc.Utf8.parse('97b60394abc2fbe1'),
    mode: 'CBC',
    padding: 'NoPadding',
};

function decrypt_base64_str(base64_str) {
    const decrypt = CryptoJS.AES.decrypt(base64_str, CRYPTO_CONFIG.key, {
        iv: CRYPTO_CONFIG.iv,
        mode: CryptoJS.mode[CRYPTO_CONFIG.mode],
        padding: CryptoJS.pad[CRYPTO_CONFIG.padding],
    });
    return decrypt.toString(CryptoJS.enc.Base64);
};

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let imageb64 = response.base64().replace(/\s+/g, "");
        let base64Image = decrypt_base64_str(imageb64);
        return Graphics.createImage(base64Image);
    }
    return null
};
