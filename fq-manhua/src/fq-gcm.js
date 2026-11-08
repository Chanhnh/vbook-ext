// AES-256-GCM for Fanqie comic images.
// Pure JS: the CryptoJS bridge cannot round-trip arbitrary binary ciphertext.

var FQ_GCM_SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

var FQ_GCM_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

function fqGcmSbox() {
    if (typeof FQ_AES_SBOX !== "undefined" && FQ_AES_SBOX && FQ_AES_SBOX.length === 256) {
        return FQ_AES_SBOX;
    }
    return FQ_GCM_SBOX;
}

function fqGcmXtime(value) {
    return ((value << 1) ^ ((value & 0x80) ? 0x1b : 0)) & 255;
}

function fqGcmExpandKey256(key) {
    var sbox = fqGcmSbox();
    var w = new Array(60);
    var i;
    for (i = 0; i < 8; i++) {
        w[i] = ((key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3]) >>> 0;
    }
    for (i = 8; i < 60; i++) {
        var t = w[i - 1];
        if (i % 8 === 0) {
            t = ((t << 8) | (t >>> 24)) >>> 0;
            t = ((sbox[(t >>> 24) & 255] << 24) |
                (sbox[(t >>> 16) & 255] << 16) |
                (sbox[(t >>> 8) & 255] << 8) |
                sbox[t & 255]) >>> 0;
            t = (t ^ (FQ_GCM_RCON[(i / 8) - 1] << 24)) >>> 0;
        } else if (i % 8 === 4) {
            t = ((sbox[(t >>> 24) & 255] << 24) |
                (sbox[(t >>> 16) & 255] << 16) |
                (sbox[(t >>> 8) & 255] << 8) |
                sbox[t & 255]) >>> 0;
        }
        w[i] = (w[i - 8] ^ t) >>> 0;
    }
    return w;
}

var FQ_GCM_TE0 = null;
var FQ_GCM_TE1 = null;
var FQ_GCM_TE2 = null;
var FQ_GCM_TE3 = null;

function fqGcmEnsureTables() {
    if (FQ_GCM_TE0) return;
    var sbox = fqGcmSbox();
    var te0 = new Int32Array(256);
    var te1 = new Int32Array(256);
    var te2 = new Int32Array(256);
    var te3 = new Int32Array(256);
    var i;
    for (i = 0; i < 256; i++) {
        var s = sbox[i];
        var s2 = fqGcmXtime(s);
        var s3 = s2 ^ s;
        te0[i] = ((s2 << 24) | (s << 16) | (s << 8) | s3) | 0;
        te1[i] = ((s3 << 24) | (s2 << 16) | (s << 8) | s) | 0;
        te2[i] = ((s << 24) | (s3 << 16) | (s2 << 8) | s) | 0;
        te3[i] = ((s << 24) | (s << 16) | (s3 << 8) | s2) | 0;
    }
    FQ_GCM_TE0 = te0;
    FQ_GCM_TE1 = te1;
    FQ_GCM_TE2 = te2;
    FQ_GCM_TE3 = te3;
}

function fqGcmEncryptBlock(block, w) {
    fqGcmEnsureTables();
    var sbox = fqGcmSbox();
    var te0 = FQ_GCM_TE0;
    var te1 = FQ_GCM_TE1;
    var te2 = FQ_GCM_TE2;
    var te3 = FQ_GCM_TE3;
    var s0 = (((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3]) ^ w[0]) | 0;
    var s1 = (((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7]) ^ w[1]) | 0;
    var s2 = (((block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11]) ^ w[2]) | 0;
    var s3 = (((block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15]) ^ w[3]) | 0;
    var r;
    var t0;
    var t1;
    var t2;
    var t3;
    for (r = 1; r <= 13; r++) {
        t0 = (te0[(s0 >>> 24) & 255] ^ te1[(s1 >>> 16) & 255] ^ te2[(s2 >>> 8) & 255] ^ te3[s3 & 255] ^ w[r * 4]) | 0;
        t1 = (te0[(s1 >>> 24) & 255] ^ te1[(s2 >>> 16) & 255] ^ te2[(s3 >>> 8) & 255] ^ te3[s0 & 255] ^ w[r * 4 + 1]) | 0;
        t2 = (te0[(s2 >>> 24) & 255] ^ te1[(s3 >>> 16) & 255] ^ te2[(s0 >>> 8) & 255] ^ te3[s1 & 255] ^ w[r * 4 + 2]) | 0;
        t3 = (te0[(s3 >>> 24) & 255] ^ te1[(s0 >>> 16) & 255] ^ te2[(s1 >>> 8) & 255] ^ te3[s2 & 255] ^ w[r * 4 + 3]) | 0;
        s0 = t0;
        s1 = t1;
        s2 = t2;
        s3 = t3;
    }
    t0 = (((sbox[(s0 >>> 24) & 255] << 24) | (sbox[(s1 >>> 16) & 255] << 16) |
        (sbox[(s2 >>> 8) & 255] << 8) | sbox[s3 & 255]) ^ w[56]) | 0;
    t1 = (((sbox[(s1 >>> 24) & 255] << 24) | (sbox[(s2 >>> 16) & 255] << 16) |
        (sbox[(s3 >>> 8) & 255] << 8) | sbox[s0 & 255]) ^ w[57]) | 0;
    t2 = (((sbox[(s2 >>> 24) & 255] << 24) | (sbox[(s3 >>> 16) & 255] << 16) |
        (sbox[(s0 >>> 8) & 255] << 8) | sbox[s1 & 255]) ^ w[58]) | 0;
    t3 = (((sbox[(s3 >>> 24) & 255] << 24) | (sbox[(s0 >>> 16) & 255] << 16) |
        (sbox[(s1 >>> 8) & 255] << 8) | sbox[s2 & 255]) ^ w[59]) | 0;
    var out = new Uint8Array(16);
    out[0] = (t0 >>> 24) & 255;
    out[1] = (t0 >>> 16) & 255;
    out[2] = (t0 >>> 8) & 255;
    out[3] = t0 & 255;
    out[4] = (t1 >>> 24) & 255;
    out[5] = (t1 >>> 16) & 255;
    out[6] = (t1 >>> 8) & 255;
    out[7] = t1 & 255;
    out[8] = (t2 >>> 24) & 255;
    out[9] = (t2 >>> 16) & 255;
    out[10] = (t2 >>> 8) & 255;
    out[11] = t2 & 255;
    out[12] = (t3 >>> 24) & 255;
    out[13] = (t3 >>> 16) & 255;
    out[14] = (t3 >>> 8) & 255;
    out[15] = t3 & 255;
    return out;
}

function fqGcmBuildTable(h) {
    var table = new Int32Array(16 * 256 * 4);
    var basis = new Int32Array(128 * 4);
    var v0 = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) | 0;
    var v1 = ((h[4] << 24) | (h[5] << 16) | (h[6] << 8) | h[7]) | 0;
    var v2 = ((h[8] << 24) | (h[9] << 16) | (h[10] << 8) | h[11]) | 0;
    var v3 = ((h[12] << 24) | (h[13] << 16) | (h[14] << 8) | h[15]) | 0;
    var i;
    var pos;
    var val;
    var off;
    var prev;
    var low;
    var bit;
    var boff;
    var poff;
    var lsb;
    for (i = 0; i < 128; i++) {
        boff = i * 4;
        basis[boff] = v0;
        basis[boff + 1] = v1;
        basis[boff + 2] = v2;
        basis[boff + 3] = v3;
        lsb = v3 & 1;
        v3 = ((v3 >>> 1) | ((v2 & 1) << 31)) | 0;
        v2 = ((v2 >>> 1) | ((v1 & 1) << 31)) | 0;
        v1 = ((v1 >>> 1) | ((v0 & 1) << 31)) | 0;
        v0 = (v0 >>> 1) | 0;
        if (lsb) v0 ^= 0xe1000000;
    }
    for (pos = 0; pos < 16; pos++) {
        for (val = 1; val < 256; val++) {
            off = (pos * 256 + val) * 4;
            prev = val & (val - 1);
            low = val ^ prev;
            bit = 0;
            while (low > 1) {
                low >>= 1;
                bit++;
            }
            boff = (pos * 8 + (7 - bit)) * 4;
            poff = (pos * 256 + prev) * 4;
            table[off] = table[poff] ^ basis[boff];
            table[off + 1] = table[poff + 1] ^ basis[boff + 1];
            table[off + 2] = table[poff + 2] ^ basis[boff + 2];
            table[off + 3] = table[poff + 3] ^ basis[boff + 3];
        }
    }
    return table;
}

// Multiply one block by H and store the four result words in out.
function fqGcmGhashBlock(table, y0, y1, y2, y3, block, out) {
    var x0 = (y0 ^ ((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3])) | 0;
    var x1 = (y1 ^ ((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7])) | 0;
    var x2 = (y2 ^ ((block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11])) | 0;
    var x3 = (y3 ^ ((block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15])) | 0;
    var z0 = 0;
    var z1 = 0;
    var z2 = 0;
    var z3 = 0;
    var idx;
    idx = ((x0 >>> 24) & 255) << 2;
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 1024 + (((x0 >>> 16) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 2048 + (((x0 >>> 8) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 3072 + ((x0 & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 4096 + (((x1 >>> 24) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 5120 + (((x1 >>> 16) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 6144 + (((x1 >>> 8) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 7168 + ((x1 & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 8192 + (((x2 >>> 24) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 9216 + (((x2 >>> 16) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 10240 + (((x2 >>> 8) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 11264 + ((x2 & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 12288 + (((x3 >>> 24) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 13312 + (((x3 >>> 16) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 14336 + (((x3 >>> 8) & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    idx = 15360 + ((x3 & 255) << 2);
    z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
    out[0] = z0;
    out[1] = z1;
    out[2] = z2;
    out[3] = z3;
}

function fqGcmGhashCipher(table, data, bits) {
    var y0 = 0;
    var y1 = 0;
    var y2 = 0;
    var y3 = 0;
    var off = 0;
    var len = data.length;
    var full = len - (len & 15);
    var x0;
    var x1;
    var x2;
    var x3;
    var z0;
    var z1;
    var z2;
    var z3;
    var idx;
    var block;
    var words = new Int32Array(4);
    var i;
    while (off < full) {
        x0 = (y0 ^ ((data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3])) | 0;
        x1 = (y1 ^ ((data[off + 4] << 24) | (data[off + 5] << 16) | (data[off + 6] << 8) | data[off + 7])) | 0;
        x2 = (y2 ^ ((data[off + 8] << 24) | (data[off + 9] << 16) | (data[off + 10] << 8) | data[off + 11])) | 0;
        x3 = (y3 ^ ((data[off + 12] << 24) | (data[off + 13] << 16) | (data[off + 14] << 8) | data[off + 15])) | 0;
        z0 = 0;
        z1 = 0;
        z2 = 0;
        z3 = 0;
        idx = ((x0 >>> 24) & 255) << 2;
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 1024 + (((x0 >>> 16) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 2048 + (((x0 >>> 8) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 3072 + ((x0 & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 4096 + (((x1 >>> 24) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 5120 + (((x1 >>> 16) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 6144 + (((x1 >>> 8) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 7168 + ((x1 & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 8192 + (((x2 >>> 24) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 9216 + (((x2 >>> 16) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 10240 + (((x2 >>> 8) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 11264 + ((x2 & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 12288 + (((x3 >>> 24) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 13312 + (((x3 >>> 16) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 14336 + (((x3 >>> 8) & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        idx = 15360 + ((x3 & 255) << 2);
        z0 ^= table[idx]; z1 ^= table[idx + 1]; z2 ^= table[idx + 2]; z3 ^= table[idx + 3];
        y0 = z0;
        y1 = z1;
        y2 = z2;
        y3 = z3;
        off += 16;
    }
    if (off < len) {
        block = new Uint8Array(16);
        for (i = 0; i < len - off; i++) block[i] = data[off + i];
        fqGcmGhashBlock(table, y0, y1, y2, y3, block, words);
        y0 = words[0];
        y1 = words[1];
        y2 = words[2];
        y3 = words[3];
    }

    block = new Uint8Array(16);
    var hi = Math.floor(bits / 4294967296);
    var lo = bits - hi * 4294967296;
    block[8] = (hi >>> 24) & 255;
    block[9] = (hi >>> 16) & 255;
    block[10] = (hi >>> 8) & 255;
    block[11] = hi & 255;
    block[12] = (lo >>> 24) & 255;
    block[13] = (lo >>> 16) & 255;
    block[14] = (lo >>> 8) & 255;
    block[15] = lo & 255;
    fqGcmGhashBlock(table, y0, y1, y2, y3, block, words);
    y0 = words[0];
    y1 = words[1];
    y2 = words[2];
    y3 = words[3];

    var out = new Uint8Array(16);
    out[0] = (y0 >>> 24) & 255;
    out[1] = (y0 >>> 16) & 255;
    out[2] = (y0 >>> 8) & 255;
    out[3] = y0 & 255;
    out[4] = (y1 >>> 24) & 255;
    out[5] = (y1 >>> 16) & 255;
    out[6] = (y1 >>> 8) & 255;
    out[7] = y1 & 255;
    out[8] = (y2 >>> 24) & 255;
    out[9] = (y2 >>> 16) & 255;
    out[10] = (y2 >>> 8) & 255;
    out[11] = y2 & 255;
    out[12] = (y3 >>> 24) & 255;
    out[13] = (y3 >>> 16) & 255;
    out[14] = (y3 >>> 8) & 255;
    out[15] = y3 & 255;
    return out;
}

// CTR mode with the 13 AES rounds unrolled and round keys held in locals.
function fqGcmCtr(ct, w, j0) {
    fqGcmEnsureTables();
    var sbox = fqGcmSbox();
    var te0 = FQ_GCM_TE0, te1 = FQ_GCM_TE1, te2 = FQ_GCM_TE2, te3 = FQ_GCM_TE3;
    var k0 = w[0];
    var k1 = w[1];
    var k2 = w[2];
    var k3 = w[3];
    var k4 = w[4];
    var k5 = w[5];
    var k6 = w[6];
    var k7 = w[7];
    var k8 = w[8];
    var k9 = w[9];
    var k10 = w[10];
    var k11 = w[11];
    var k12 = w[12];
    var k13 = w[13];
    var k14 = w[14];
    var k15 = w[15];
    var k16 = w[16];
    var k17 = w[17];
    var k18 = w[18];
    var k19 = w[19];
    var k20 = w[20];
    var k21 = w[21];
    var k22 = w[22];
    var k23 = w[23];
    var k24 = w[24];
    var k25 = w[25];
    var k26 = w[26];
    var k27 = w[27];
    var k28 = w[28];
    var k29 = w[29];
    var k30 = w[30];
    var k31 = w[31];
    var k32 = w[32];
    var k33 = w[33];
    var k34 = w[34];
    var k35 = w[35];
    var k36 = w[36];
    var k37 = w[37];
    var k38 = w[38];
    var k39 = w[39];
    var k40 = w[40];
    var k41 = w[41];
    var k42 = w[42];
    var k43 = w[43];
    var k44 = w[44];
    var k45 = w[45];
    var k46 = w[46];
    var k47 = w[47];
    var k48 = w[48];
    var k49 = w[49];
    var k50 = w[50];
    var k51 = w[51];
    var k52 = w[52];
    var k53 = w[53];
    var k54 = w[54];
    var k55 = w[55];
    var k56 = w[56];
    var k57 = w[57];
    var k58 = w[58];
    var k59 = w[59];
    var out = new Uint8Array(ct.length);
    var c0 = ((j0[0] << 24) | (j0[1] << 16) | (j0[2] << 8) | j0[3]) | 0;
    var c1 = ((j0[4] << 24) | (j0[5] << 16) | (j0[6] << 8) | j0[7]) | 0;
    var c2 = ((j0[8] << 24) | (j0[9] << 16) | (j0[10] << 8) | j0[11]) | 0;
    var c3 = ((j0[12] << 24) | (j0[13] << 16) | (j0[14] << 8) | j0[15]) | 0;
    c3 = (c3 + 1) | 0;
    var len = ct.length, full = len - (len & 15), off = 0;
    var a0,a1,a2,a3,t0,t1,t2,t3,o0,o1,o2,o3,i,n;
    while (off < full) {
        a0 = (c0 ^ k0) | 0; a1 = (c1 ^ k1) | 0; a2 = (c2 ^ k2) | 0; a3 = (c3 ^ k3) | 0;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k4) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k5) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k6) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k7) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k8) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k9) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k10) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k11) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k12) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k13) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k14) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k15) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k16) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k17) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k18) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k19) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k20) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k21) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k22) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k23) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k24) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k25) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k26) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k27) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k28) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k29) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k30) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k31) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k32) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k33) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k34) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k35) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k36) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k37) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k38) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k39) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k40) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k41) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k42) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k43) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k44) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k45) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k46) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k47) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k48) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k49) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k50) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k51) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (te0[(a0 >>> 24) & 255] ^ te1[(a1 >>> 16) & 255] ^ te2[(a2 >>> 8) & 255] ^ te3[a3 & 255] ^ k52) | 0; t1 = (te0[(a1 >>> 24) & 255] ^ te1[(a2 >>> 16) & 255] ^ te2[(a3 >>> 8) & 255] ^ te3[a0 & 255] ^ k53) | 0; t2 = (te0[(a2 >>> 24) & 255] ^ te1[(a3 >>> 16) & 255] ^ te2[(a0 >>> 8) & 255] ^ te3[a1 & 255] ^ k54) | 0; t3 = (te0[(a3 >>> 24) & 255] ^ te1[(a0 >>> 16) & 255] ^ te2[(a1 >>> 8) & 255] ^ te3[a2 & 255] ^ k55) | 0;
        a0 = t0; a1 = t1; a2 = t2; a3 = t3;
        t0 = (((sbox[(a0 >>> 24) & 255] << 24) | (sbox[(a1 >>> 16) & 255] << 16) | (sbox[(a2 >>> 8) & 255] << 8) | sbox[a3 & 255]) ^ k56) | 0;
        t1 = (((sbox[(a1 >>> 24) & 255] << 24) | (sbox[(a2 >>> 16) & 255] << 16) | (sbox[(a3 >>> 8) & 255] << 8) | sbox[a0 & 255]) ^ k57) | 0;
        t2 = (((sbox[(a2 >>> 24) & 255] << 24) | (sbox[(a3 >>> 16) & 255] << 16) | (sbox[(a0 >>> 8) & 255] << 8) | sbox[a1 & 255]) ^ k58) | 0;
        t3 = (((sbox[(a3 >>> 24) & 255] << 24) | (sbox[(a0 >>> 16) & 255] << 16) | (sbox[(a1 >>> 8) & 255] << 8) | sbox[a2 & 255]) ^ k59) | 0;
        o0 = (((ct[off] << 24) | (ct[off+1] << 16) | (ct[off+2] << 8) | ct[off+3]) ^ t0) | 0;
        o1 = (((ct[off+4] << 24) | (ct[off+5] << 16) | (ct[off+6] << 8) | ct[off+7]) ^ t1) | 0;
        o2 = (((ct[off+8] << 24) | (ct[off+9] << 16) | (ct[off+10] << 8) | ct[off+11]) ^ t2) | 0;
        o3 = (((ct[off+12] << 24) | (ct[off+13] << 16) | (ct[off+14] << 8) | ct[off+15]) ^ t3) | 0;
        out[off] = (o0>>>24)&255; out[off+1] = (o0>>>16)&255; out[off+2] = (o0>>>8)&255; out[off+3] = o0&255;
        out[off+4] = (o1>>>24)&255; out[off+5] = (o1>>>16)&255; out[off+6] = (o1>>>8)&255; out[off+7] = o1&255;
        out[off+8] = (o2>>>24)&255; out[off+9] = (o2>>>16)&255; out[off+10] = (o2>>>8)&255; out[off+11] = o2&255;
        out[off+12] = (o3>>>24)&255; out[off+13] = (o3>>>16)&255; out[off+14] = (o3>>>8)&255; out[off+15] = o3&255;
        c3 = (c3 + 1) | 0; off += 16;
    }
    if (off < len) {
        var cb = new Uint8Array(16);
        cb[0] = (c0>>>24)&255; cb[1] = (c0>>>16)&255; cb[2] = (c0>>>8)&255; cb[3] = c0&255;
        cb[4] = (c1>>>24)&255; cb[5] = (c1>>>16)&255; cb[6] = (c1>>>8)&255; cb[7] = c1&255;
        cb[8] = (c2>>>24)&255; cb[9] = (c2>>>16)&255; cb[10] = (c2>>>8)&255; cb[11] = c2&255;
        cb[12] = (c3>>>24)&255; cb[13] = (c3>>>16)&255; cb[14] = (c3>>>8)&255; cb[15] = c3&255;
        var ks = fqGcmEncryptBlock(cb, w);
        n = len - off;
        for (i = 0; i < n; i++) out[off+i] = ct[off+i] ^ ks[i];
    }
    return out;
}

var FQ_GCM_CACHE_ID = "";
var FQ_GCM_CACHE_W = null;
var FQ_GCM_CACHE_TABLE = null;

function fqGcmDecryptPure(data, key) {
    if (data.length < 28) throw new Error("Ảnh mã hóa quá ngắn.");
    if (key.length !== 32) throw new Error("Khóa ảnh không phải AES-256.");
    var iv = data.subarray(0, 12);
    var tag = data.subarray(data.length - 16);
    var ct = data.subarray(12, data.length - 16);
    var keyId = fqHexEncode(key);
    var w;
    var table;
    if (keyId === FQ_GCM_CACHE_ID && FQ_GCM_CACHE_W && FQ_GCM_CACHE_TABLE) {
        w = FQ_GCM_CACHE_W;
        table = FQ_GCM_CACHE_TABLE;
    } else {
        w = fqGcmExpandKey256(key);
        table = fqGcmBuildTable(fqGcmEncryptBlock(new Uint8Array(16), w));
        FQ_GCM_CACHE_ID = keyId;
        FQ_GCM_CACHE_W = w;
        FQ_GCM_CACHE_TABLE = table;
    }
    var j0 = new Uint8Array(16);
    j0.set(iv);
    j0[15] = 1;

    var s = fqGcmGhashCipher(table, ct, ct.length * 8);
    var ek = fqGcmEncryptBlock(j0, w);
    var diff = 0;
    var i;
    for (i = 0; i < 16; i++) diff |= (ek[i] ^ s[i]) ^ tag[i];
    if (diff !== 0) throw new Error("Ảnh không vượt qua kiểm tra GCM.");

    return fqGcmCtr(ct, w, j0);
}

function fqComicLooksLikeImage(data) {
    if (!data || data.length < 4) return false;
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return true;
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return true;
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return true;
    if (data.length >= 12 && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
        data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return true;
    return false;
}

function fqComicImageValid(data, expectedMd5) {
    if (!data || !data.length) return false;
    if (!fqComicLooksLikeImage(data)) return false;
    if (expectedMd5 && data.length <= 65536) {
        return fqMd5Hex(data) === String(expectedMd5).toLowerCase();
    }
    return true;
}

function fqComicDecryptImage(data, keyHex, expectedMd5) {
    var key = fqHexDecode(keyHex);
    if (key.length !== 32) throw new Error("Khóa ảnh không hợp lệ.");
    var plain = fqGcmDecryptPure(data, key);
    if (!fqComicImageValid(plain, expectedMd5)) throw new Error("Ảnh giải mã không hợp lệ.");
    return plain;
}
