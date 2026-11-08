// Pure-JS primitives used by the Fanqie app API.
// Rhino has no BigInt and CryptoJS cannot round-trip bytes >= 0x80.

var FQ_B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function fqToBytes(data) {
    if (data instanceof Uint8Array) return data;
    if (Object.prototype.toString.call(data) === "[object Array]") return new Uint8Array(data);
    if (typeof data === "string") return fqUtf8Encode(data);
    throw new Error("Unsupported byte input");
}

function fqConcat() {
    var total = 0;
    var i;
    for (i = 0; i < arguments.length; i++) total += arguments[i].length;
    var out = new Uint8Array(total);
    var off = 0;
    for (i = 0; i < arguments.length; i++) {
        out.set(arguments[i], off);
        off += arguments[i].length;
    }
    return out;
}

var FQ_B64_LOOKUP = null;
var FQ_B64_PAIRS = null;

function fqB64Lookup() {
    if (FQ_B64_LOOKUP) return FQ_B64_LOOKUP;
    var table = new Int16Array(256);
    var i;
    for (i = 0; i < 256; i++) table[i] = -1;
    for (i = 0; i < 64; i++) table[FQ_B64_CHARS.charCodeAt(i)] = i;
    FQ_B64_LOOKUP = table;
    return table;
}

function fqB64PairTable() {
    if (FQ_B64_PAIRS) return FQ_B64_PAIRS;
    var pairs = new Array(4096);
    var i;
    for (i = 0; i < 4096; i++) {
        pairs[i] = FQ_B64_CHARS.charAt(i >> 6) + FQ_B64_CHARS.charAt(i & 63);
    }
    FQ_B64_PAIRS = pairs;
    return pairs;
}

function fqB64Encode(data) {
    var bytes = fqToBytes(data);
    var pairs = fqB64PairTable();
    var out = [];
    var full = bytes.length - (bytes.length % 3);
    var i;
    for (i = 0; i < full; i += 3) {
        var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        out.push(pairs[n >> 12] + pairs[n & 4095]);
    }
    var rem = bytes.length - full;
    if (rem === 1) {
        var b1 = bytes[full];
        out.push(FQ_B64_CHARS.charAt(b1 >> 2) + FQ_B64_CHARS.charAt((b1 & 3) << 4) + "==");
    } else if (rem === 2) {
        var c1 = bytes[full];
        var c2 = bytes[full + 1];
        var m = (c1 << 16) | (c2 << 8);
        out.push(pairs[m >> 12] + FQ_B64_CHARS.charAt((c2 & 15) << 2) + "=");
    }
    return out.join("");
}

function fqB64Decode(text) {
    var str = String(text || "").replace(/[^A-Za-z0-9+/=]/g, "");
    var lookup = fqB64Lookup();
    var out = new Uint8Array(Math.floor(str.length * 3 / 4) + 3);
    var pos = 0;
    var i;
    for (i = 0; i < str.length; i += 4) {
        var e1 = lookup[str.charCodeAt(i)];
        var e2 = lookup[str.charCodeAt(i + 1)];
        var e3 = lookup[str.charCodeAt(i + 2)];
        var e4 = lookup[str.charCodeAt(i + 3)];
        if (e1 < 0) e1 = 0;
        if (e2 < 0) e2 = 0;
        if (e3 < 0) e3 = 0;
        if (e4 < 0) e4 = 0;
        var n = (e1 << 18) | (e2 << 12) | (e3 << 6) | e4;
        out[pos++] = (n >> 16) & 255;
        if (i + 2 < str.length && str.charAt(i + 2) !== "=") out[pos++] = (n >> 8) & 255;
        if (i + 3 < str.length && str.charAt(i + 3) !== "=") out[pos++] = n & 255;
    }
    return out.subarray(0, pos);
}

function fqLatin1Bytes(text) {
    var str = String(text || "");
    var out = new Uint8Array(str.length);
    var i;
    for (i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
    return out;
}

function fqHexEncode(data) {
    var bytes = fqToBytes(data);
    var out = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
        var h = bytes[i].toString(16);
        out += h.length === 1 ? "0" + h : h;
    }
    return out;
}

function fqHexDecode(text) {
    var str = String(text || "").replace(/[^0-9a-fA-F]/g, "");
    if (str.length % 2 === 1) str = "0" + str;
    var out = new Uint8Array(str.length / 2);
    var i;
    for (i = 0; i < out.length; i++) out[i] = parseInt(str.substring(i * 2, i * 2 + 2), 16);
    return out;
}

function fqUtf8Encode(text) {
    var str = String(text || "");
    var out = [];
    var i;
    for (i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) {
            out.push(c);
        } else if (c < 0x800) {
            out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
            var d = str.charCodeAt(i + 1);
            if (d >= 0xdc00 && d <= 0xdfff) {
                var cp = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
                out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
                i++;
            } else {
                out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
            }
        } else {
            out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        }
    }
    return new Uint8Array(out);
}

function fqUtf8Decode(data) {
    var bytes = fqToBytes(data);
    var out = [];
    var i = 0;
    while (i < bytes.length) {
        var b0 = bytes[i++];
        if (b0 < 0x80) {
            out.push(b0);
        } else if ((b0 & 0xe0) === 0xc0 && i < bytes.length) {
            out.push(((b0 & 31) << 6) | (bytes[i++] & 63));
        } else if ((b0 & 0xf0) === 0xe0 && i + 1 < bytes.length) {
            out.push(((b0 & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
        } else if ((b0 & 0xf8) === 0xf0 && i + 2 < bytes.length) {
            var cp = ((b0 & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            if (cp > 0xffff) {
                cp -= 0x10000;
                out.push(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
            } else {
                out.push(cp);
            }
        } else {
            out.push(0xfffd);
        }
    }
    var chunks = [];
    for (i = 0; i < out.length; i += 8192) {
        chunks.push(String.fromCharCode.apply(null, out.slice(i, i + 8192)));
    }
    return chunks.join("");
}

function fqRandomBytes(n) {
    var out = new Uint8Array(n);
    var i;
    for (i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
    return out;
}

function fqRandomHex(n) {
    var bytes = fqRandomBytes(Math.ceil(n / 2));
    return fqHexEncode(bytes).substring(0, n);
}

function fqUuid() {
    var b = fqRandomBytes(16);
    b[6] = (b[6] & 15) | 0x40;
    b[8] = (b[8] & 63) | 0x80;
    var h = fqHexEncode(b);
    return h.substring(0, 8) + "-" + h.substring(8, 12) + "-" + h.substring(12, 16) + "-" + h.substring(16, 20) + "-" + h.substring(20);
}

function fqCrc32(data) {
    var bytes = fqToBytes(data);
    var c = 0xffffffff;
    var i;
    var k;
    for (i = 0; i < bytes.length; i++) {
        c ^= bytes[i];
        for (k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
}

// Valid gzip stream with stored (uncompressed) deflate blocks.
function fqGzipStore(data) {
    var bytes = fqToBytes(data);
    var out = [0x1f, 0x8b, 0x08, 0x00, 0, 0, 0, 0, 0, 0x03];
    var off = 0;
    do {
        var len = Math.min(65535, bytes.length - off);
        var final = off + len >= bytes.length ? 1 : 0;
        out.push(final, len & 255, (len >>> 8) & 255, (~len) & 255, ((~len) >>> 8) & 255);
        var i;
        for (i = 0; i < len; i++) out.push(bytes[off + i]);
        off += len;
    } while (off < bytes.length);
    var crc = fqCrc32(bytes);
    var size = bytes.length;
    out.push(crc & 255, (crc >>> 8) & 255, (crc >>> 16) & 255, (crc >>> 24) & 255);
    out.push(size & 255, (size >>> 8) & 255, (size >>> 16) & 255, (size >>> 24) & 255);
    return new Uint8Array(out);
}

function fqGunzip(data) {
    var bytes = fqToBytes(data);
    if (bytes.length < 18 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
    return fqFflate.gunzipSync(bytes);
}

function fqRotl32(x, n) {
    return ((x << n) | (x >>> (32 - n))) | 0;
}

var FQ_MD5_K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
];

var FQ_MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

function fqMd5(data) {
    var bytes = fqToBytes(data);
    var len = bytes.length;
    var paddedLen = (((len + 8) >>> 6) + 1) * 64;
    var msg = new Uint8Array(paddedLen);
    msg.set(bytes);
    msg[len] = 0x80;
    var bitLen = len * 8;
    var lo = bitLen >>> 0;
    var hi = Math.floor(bitLen / 4294967296) >>> 0;
    var i;
    for (i = 0; i < 4; i++) {
        msg[paddedLen - 8 + i] = (lo >>> (i * 8)) & 255;
        msg[paddedLen - 4 + i] = (hi >>> (i * 8)) & 255;
    }
    var a0 = 0x67452301;
    var b0 = 0xefcdab89;
    var c0 = 0x98badcfe;
    var d0 = 0x10325476;
    var off;
    for (off = 0; off < msg.length; off += 64) {
        var m = new Array(16);
        for (i = 0; i < 16; i++) {
            var o = off + i * 4;
            m[i] = (msg[o] | (msg[o + 1] << 8) | (msg[o + 2] << 16) | (msg[o + 3] << 24)) | 0;
        }
        var A = a0;
        var B = b0;
        var C = c0;
        var D = d0;
        for (i = 0; i < 64; i++) {
            var F;
            var g;
            if (i < 16) {
                F = (B & C) | (~B & D);
                g = i;
            } else if (i < 32) {
                F = (D & B) | (~D & C);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                F = B ^ C ^ D;
                g = (3 * i + 5) % 16;
            } else {
                F = C ^ (B | ~D);
                g = (7 * i) % 16;
            }
            F = (F + A + FQ_MD5_K[i] + m[g]) | 0;
            A = D;
            D = C;
            C = B;
            B = (B + fqRotl32(F, FQ_MD5_S[i])) | 0;
        }
        a0 = (a0 + A) | 0;
        b0 = (b0 + B) | 0;
        c0 = (c0 + C) | 0;
        d0 = (d0 + D) | 0;
    }
    var out = new Uint8Array(16);
    var vals = [a0, b0, c0, d0];
    for (i = 0; i < 4; i++) {
        out[i * 4] = vals[i] & 255;
        out[i * 4 + 1] = (vals[i] >>> 8) & 255;
        out[i * 4 + 2] = (vals[i] >>> 16) & 255;
        out[i * 4 + 3] = (vals[i] >>> 24) & 255;
    }
    return out;
}

function fqMd5Hex(data) {
    return fqHexEncode(fqMd5(data));
}

function fqReadU32BE(bytes, off) {
    return ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0;
}

function fqWriteU32BE(bytes, off, value) {
    bytes[off] = (value >>> 24) & 255;
    bytes[off + 1] = (value >>> 16) & 255;
    bytes[off + 2] = (value >>> 8) & 255;
    bytes[off + 3] = value & 255;
}

function fqSm3P0(x) {
    return (x ^ fqRotl32(x, 9) ^ fqRotl32(x, 17)) >>> 0;
}

function fqSm3P1(x) {
    return (x ^ fqRotl32(x, 15) ^ fqRotl32(x, 23)) >>> 0;
}

function fqSm3(data) {
    var bytes = fqToBytes(data);
    var len = bytes.length;
    var paddedLen = Math.ceil((len + 9) / 64) * 64;
    var msg = new Uint8Array(paddedLen);
    msg.set(bytes);
    msg[len] = 0x80;
    var bitLo = (len * 8) >>> 0;
    var bitHi = Math.floor(len / 536870912) >>> 0;
    var i;
    for (i = 0; i < 4; i++) {
        msg[paddedLen - 8 + i] = (bitHi >>> (24 - i * 8)) & 255;
        msg[paddedLen - 4 + i] = (bitLo >>> (24 - i * 8)) & 255;
    }
    var state = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e];
    var off;
    for (off = 0; off < msg.length; off += 64) {
        var w = new Array(68);
        var w1 = new Array(64);
        for (i = 0; i < 16; i++) w[i] = fqReadU32BE(msg, off + i * 4);
        for (i = 16; i < 68; i++) {
            w[i] = (fqSm3P1((w[i - 16] ^ w[i - 9] ^ fqRotl32(w[i - 3], 15)) >>> 0) ^ fqRotl32(w[i - 13], 7) ^ w[i - 6]) >>> 0;
        }
        for (i = 0; i < 64; i++) w1[i] = (w[i] ^ w[i + 4]) >>> 0;
        var a = state[0];
        var b = state[1];
        var c = state[2];
        var d = state[3];
        var e = state[4];
        var f = state[5];
        var g = state[6];
        var h = state[7];
        for (i = 0; i < 64; i++) {
            var t = i <= 15 ? 0x79cc4519 : 0x7a879d8a;
            var ss1 = fqRotl32((fqRotl32(a, 12) + e + fqRotl32(t, i)) >>> 0, 7);
            var ss2 = (ss1 ^ fqRotl32(a, 12)) >>> 0;
            var ff = i <= 15 ? (a ^ b ^ c) : ((a & b) | (a & c) | (b & c));
            var gg = i <= 15 ? (e ^ f ^ g) : ((e & f) | (~e & g));
            var tt1 = (ff + d + ss2 + w1[i]) >>> 0;
            var tt2 = (gg + h + ss1 + w[i]) >>> 0;
            d = c;
            c = fqRotl32(b, 9);
            b = a;
            a = tt1;
            h = g;
            g = fqRotl32(f, 19);
            f = e;
            e = fqSm3P0(tt2);
        }
        state[0] = (state[0] ^ a) >>> 0;
        state[1] = (state[1] ^ b) >>> 0;
        state[2] = (state[2] ^ c) >>> 0;
        state[3] = (state[3] ^ d) >>> 0;
        state[4] = (state[4] ^ e) >>> 0;
        state[5] = (state[5] ^ f) >>> 0;
        state[6] = (state[6] ^ g) >>> 0;
        state[7] = (state[7] ^ h) >>> 0;
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) fqWriteU32BE(out, i * 4, state[i]);
    return out;
}

var FQ_AES_SBOX = [
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

var FQ_AES_INV_SBOX = new Uint8Array(256);
(function () {
    var i;
    for (i = 0; i < 256; i++) FQ_AES_INV_SBOX[FQ_AES_SBOX[i]] = i;
})();

var FQ_AES_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

// T-table AES-128 decrypt; tables are built lazily on the first decrypt.
var FQ_AES_TD0 = null;
var FQ_AES_TD1 = null;
var FQ_AES_TD2 = null;
var FQ_AES_TD3 = null;
var FQ_AES_M9 = null;
var FQ_AES_M11 = null;
var FQ_AES_M13 = null;
var FQ_AES_M14 = null;

function fqAesExpandKey(keyBytes) {
    var key = fqToBytes(keyBytes);
    if (key.length !== 16) throw new Error("AES-128 key must be 16 bytes");
    var w = new Array(44);
    var i;
    for (i = 0; i < 4; i++) {
        w[i] = ((key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3]) >>> 0;
    }
    for (i = 4; i < 44; i++) {
        var t = w[i - 1];
        if (i % 4 === 0) {
            t = ((t << 8) | (t >>> 24)) >>> 0;
            t = ((FQ_AES_SBOX[(t >>> 24) & 255] << 24) |
                (FQ_AES_SBOX[(t >>> 16) & 255] << 16) |
                (FQ_AES_SBOX[(t >>> 8) & 255] << 8) |
                FQ_AES_SBOX[t & 255]) >>> 0;
            t = (t ^ (FQ_AES_RCON[(i / 4) - 1] << 24)) >>> 0;
        }
        w[i] = (w[i - 4] ^ t) >>> 0;
    }
    return w;
}

function fqAesAddRoundKey(state, w, round) {
    var c;
    for (c = 0; c < 4; c++) {
        var k = w[round * 4 + c];
        state[c * 4] ^= (k >>> 24) & 255;
        state[c * 4 + 1] ^= (k >>> 16) & 255;
        state[c * 4 + 2] ^= (k >>> 8) & 255;
        state[c * 4 + 3] ^= k & 255;
    }
}

function fqAesSubBytes(state, inv) {
    var box = inv ? FQ_AES_INV_SBOX : FQ_AES_SBOX;
    var i;
    for (i = 0; i < 16; i++) state[i] = box[state[i]];
}

function fqAesShiftRows(state, inv) {
    var tmp = new Uint8Array(state);
    var r;
    var c;
    for (r = 0; r < 4; r++) {
        for (c = 0; c < 4; c++) {
            var src = inv ? (c - r + 4) % 4 : (c + r) % 4;
            state[r + 4 * c] = tmp[r + 4 * src];
        }
    }
}

function fqAesXtime(b) {
    return ((b << 1) ^ ((b & 0x80) ? 0x1b : 0)) & 255;
}

function fqAesInitDecryptTables() {
    if (FQ_AES_TD0) return;
    var td0 = new Int32Array(256);
    var td1 = new Int32Array(256);
    var td2 = new Int32Array(256);
    var td3 = new Int32Array(256);
    var m9 = new Uint8Array(256);
    var m11 = new Uint8Array(256);
    var m13 = new Uint8Array(256);
    var m14 = new Uint8Array(256);
    var i;
    for (i = 0; i < 256; i++) {
        var s = FQ_AES_INV_SBOX[i];
        var s2 = fqAesXtime(s);
        var s4 = fqAesXtime(s2);
        var s8 = fqAesXtime(s4);
        var v9 = s8 ^ s;
        var v11 = s8 ^ s2 ^ s;
        var v13 = s8 ^ s4 ^ s;
        var v14 = s8 ^ s4 ^ s2;
        m9[s] = v9;
        m11[s] = v11;
        m13[s] = v13;
        m14[s] = v14;
        td0[i] = (v14 << 24) | (v9 << 16) | (v13 << 8) | v11;
        td1[i] = (v11 << 24) | (v14 << 16) | (v9 << 8) | v13;
        td2[i] = (v13 << 24) | (v11 << 16) | (v14 << 8) | v9;
        td3[i] = (v9 << 24) | (v13 << 16) | (v11 << 8) | v14;
    }
    FQ_AES_TD0 = td0;
    FQ_AES_TD1 = td1;
    FQ_AES_TD2 = td2;
    FQ_AES_TD3 = td3;
    FQ_AES_M9 = m9;
    FQ_AES_M11 = m11;
    FQ_AES_M13 = m13;
    FQ_AES_M14 = m14;
}

function fqAesDecryptKeySchedule(w) {
    var kd = new Int32Array(44);
    var r;
    var c;
    for (c = 0; c < 4; c++) {
        kd[c] = w[40 + c];
        kd[40 + c] = w[c];
    }
    for (r = 1; r < 10; r++) {
        for (c = 0; c < 4; c++) {
            var x = w[(10 - r) * 4 + c];
            var b0 = (x >>> 24) & 255;
            var b1 = (x >>> 16) & 255;
            var b2 = (x >>> 8) & 255;
            var b3 = x & 255;
            kd[r * 4 + c] = ((FQ_AES_M14[b0] ^ FQ_AES_M11[b1] ^ FQ_AES_M13[b2] ^ FQ_AES_M9[b3]) << 24) |
                ((FQ_AES_M9[b0] ^ FQ_AES_M14[b1] ^ FQ_AES_M11[b2] ^ FQ_AES_M13[b3]) << 16) |
                ((FQ_AES_M13[b0] ^ FQ_AES_M9[b1] ^ FQ_AES_M14[b2] ^ FQ_AES_M11[b3]) << 8) |
                (FQ_AES_M11[b0] ^ FQ_AES_M13[b1] ^ FQ_AES_M9[b2] ^ FQ_AES_M14[b3]);
        }
    }
    return kd;
}

function fqAesMixColumns(state) {
    var c;
    for (c = 0; c < 4; c++) {
        var i = c * 4;
        var a0 = state[i];
        var a1 = state[i + 1];
        var a2 = state[i + 2];
        var a3 = state[i + 3];
        state[i] = fqAesXtime(a0) ^ (fqAesXtime(a1) ^ a1) ^ a2 ^ a3;
        state[i + 1] = a0 ^ fqAesXtime(a1) ^ (fqAesXtime(a2) ^ a2) ^ a3;
        state[i + 2] = a0 ^ a1 ^ fqAesXtime(a2) ^ (fqAesXtime(a3) ^ a3);
        state[i + 3] = (fqAesXtime(a0) ^ a0) ^ a1 ^ a2 ^ fqAesXtime(a3);
    }
}

function fqAesEncryptBlock(block, w) {
    var state = new Uint8Array(block);
    var round;
    fqAesAddRoundKey(state, w, 0);
    for (round = 1; round <= 9; round++) {
        fqAesSubBytes(state, false);
        fqAesShiftRows(state, false);
        fqAesMixColumns(state);
        fqAesAddRoundKey(state, w, round);
    }
    fqAesSubBytes(state, false);
    fqAesShiftRows(state, false);
    fqAesAddRoundKey(state, w, 10);
    return state;
}

function fqPkcs7Pad(data, blockSize) {
    var bytes = fqToBytes(data);
    var pad = blockSize - (bytes.length % blockSize);
    var out = new Uint8Array(bytes.length + pad);
    out.set(bytes);
    var i;
    for (i = 0; i < pad; i++) out[bytes.length + i] = pad;
    return out;
}

function fqPkcs7Unpad(data) {
    var bytes = fqToBytes(data);
    if (!bytes.length) return bytes;
    var pad = bytes[bytes.length - 1];
    if (pad < 1 || pad > 16 || pad > bytes.length) return bytes;
    var i;
    for (i = 0; i < pad; i++) {
        if (bytes[bytes.length - 1 - i] !== pad) return bytes;
    }
    return bytes.subarray(0, bytes.length - pad);
}

function fqAesEncrypt(keyBytes, ivBytes, dataBytes) {
    var key = fqToBytes(keyBytes);
    var iv = fqToBytes(ivBytes);
    var data = fqPkcs7Pad(dataBytes, 16);
    if (iv.length !== 16) throw new Error("AES IV must be 16 bytes");
    var w = fqAesExpandKey(key);
    var out = new Uint8Array(data.length);
    var prev = new Uint8Array(iv);
    var off;
    for (off = 0; off < data.length; off += 16) {
        var block = new Uint8Array(16);
        var i;
        for (i = 0; i < 16; i++) block[i] = data[off + i] ^ prev[i];
        block = fqAesEncryptBlock(block, w);
        out.set(block, off);
        prev = block;
    }
    return out;
}

function fqAesDecrypt(keyBytes, ivBytes, dataBytes) {
    var key = fqToBytes(keyBytes);
    var iv = fqToBytes(ivBytes);
    var data = fqToBytes(dataBytes);
    if (iv.length !== 16) throw new Error("AES IV must be 16 bytes");
    if (data.length % 16 !== 0) throw new Error("AES ciphertext is not block aligned");
    var w = fqAesExpandKey(key);
    fqAesInitDecryptTables();
    var kd = fqAesDecryptKeySchedule(w);
    var td0 = FQ_AES_TD0;
    var td1 = FQ_AES_TD1;
    var td2 = FQ_AES_TD2;
    var td3 = FQ_AES_TD3;
    var sbox = FQ_AES_INV_SBOX;
    var out = new Uint8Array(data.length);
    var prev0 = ((iv[0] << 24) | (iv[1] << 16) | (iv[2] << 8) | iv[3]) | 0;
    var prev1 = ((iv[4] << 24) | (iv[5] << 16) | (iv[6] << 8) | iv[7]) | 0;
    var prev2 = ((iv[8] << 24) | (iv[9] << 16) | (iv[10] << 8) | iv[11]) | 0;
    var prev3 = ((iv[12] << 24) | (iv[13] << 16) | (iv[14] << 8) | iv[15]) | 0;
    var off;
    for (off = 0; off < data.length; off += 16) {
        var c0 = ((data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]) | 0;
        var c1 = ((data[off + 4] << 24) | (data[off + 5] << 16) | (data[off + 6] << 8) | data[off + 7]) | 0;
        var c2 = ((data[off + 8] << 24) | (data[off + 9] << 16) | (data[off + 10] << 8) | data[off + 11]) | 0;
        var c3 = ((data[off + 12] << 24) | (data[off + 13] << 16) | (data[off + 14] << 8) | data[off + 15]) | 0;
        var s0 = c0 ^ kd[0];
        var s1 = c1 ^ kd[1];
        var s2 = c2 ^ kd[2];
        var s3 = c3 ^ kd[3];
        var r;
        for (r = 1; r < 10; r++) {
            var k = r * 4;
            var a0 = td0[(s0 >>> 24) & 255] ^ td1[(s3 >>> 16) & 255] ^ td2[(s2 >>> 8) & 255] ^ td3[s1 & 255] ^ kd[k];
            var a1 = td0[(s1 >>> 24) & 255] ^ td1[(s0 >>> 16) & 255] ^ td2[(s3 >>> 8) & 255] ^ td3[s2 & 255] ^ kd[k + 1];
            var a2 = td0[(s2 >>> 24) & 255] ^ td1[(s1 >>> 16) & 255] ^ td2[(s0 >>> 8) & 255] ^ td3[s3 & 255] ^ kd[k + 2];
            var a3 = td0[(s3 >>> 24) & 255] ^ td1[(s2 >>> 16) & 255] ^ td2[(s1 >>> 8) & 255] ^ td3[s0 & 255] ^ kd[k + 3];
            s0 = a0;
            s1 = a1;
            s2 = a2;
            s3 = a3;
        }
        var p0 = ((sbox[(s0 >>> 24) & 255] << 24) | (sbox[(s3 >>> 16) & 255] << 16) | (sbox[(s2 >>> 8) & 255] << 8) | sbox[s1 & 255]) ^ kd[40];
        var p1 = ((sbox[(s1 >>> 24) & 255] << 24) | (sbox[(s0 >>> 16) & 255] << 16) | (sbox[(s3 >>> 8) & 255] << 8) | sbox[s2 & 255]) ^ kd[41];
        var p2 = ((sbox[(s2 >>> 24) & 255] << 24) | (sbox[(s1 >>> 16) & 255] << 16) | (sbox[(s0 >>> 8) & 255] << 8) | sbox[s3 & 255]) ^ kd[42];
        var p3 = ((sbox[(s3 >>> 24) & 255] << 24) | (sbox[(s2 >>> 16) & 255] << 16) | (sbox[(s1 >>> 8) & 255] << 8) | sbox[s0 & 255]) ^ kd[43];
        var v0 = p0 ^ prev0;
        var v1 = p1 ^ prev1;
        var v2 = p2 ^ prev2;
        var v3 = p3 ^ prev3;
        out[off] = (v0 >>> 24) & 255;
        out[off + 1] = (v0 >>> 16) & 255;
        out[off + 2] = (v0 >>> 8) & 255;
        out[off + 3] = v0 & 255;
        out[off + 4] = (v1 >>> 24) & 255;
        out[off + 5] = (v1 >>> 16) & 255;
        out[off + 6] = (v1 >>> 8) & 255;
        out[off + 7] = v1 & 255;
        out[off + 8] = (v2 >>> 24) & 255;
        out[off + 9] = (v2 >>> 16) & 255;
        out[off + 10] = (v2 >>> 8) & 255;
        out[off + 11] = v2 & 255;
        out[off + 12] = (v3 >>> 24) & 255;
        out[off + 13] = (v3 >>> 16) & 255;
        out[off + 14] = (v3 >>> 8) & 255;
        out[off + 15] = v3 & 255;
        prev0 = c0;
        prev1 = c1;
        prev2 = c2;
        prev3 = c3;
    }
    return fqPkcs7Unpad(out);
}

function fqU64(hi, lo) {
    return [hi >>> 0, lo >>> 0];
}

function fqXor64(a, b) {
    return [(a[0] ^ b[0]) >>> 0, (a[1] ^ b[1]) >>> 0];
}

function fqAnd64(a, b) {
    return [(a[0] & b[0]) >>> 0, (a[1] & b[1]) >>> 0];
}

function fqNot64(a) {
    return [(~a[0]) >>> 0, (~a[1]) >>> 0];
}

function fqShl64(a, n) {
    n = n & 63;
    if (n === 0) return [a[0], a[1]];
    if (n < 32) return [((a[0] << n) | (a[1] >>> (32 - n))) >>> 0, (a[1] << n) >>> 0];
    if (n === 32) return [a[1], 0];
    return [(a[1] << (n - 32)) >>> 0, 0];
}

function fqShr64(a, n) {
    n = n & 63;
    if (n === 0) return [a[0], a[1]];
    if (n < 32) return [(a[0] >>> n) >>> 0, ((a[1] >>> n) | (a[0] << (32 - n))) >>> 0];
    if (n === 32) return [0, a[0]];
    return [0, (a[0] >>> (n - 32)) >>> 0];
}

function fqRotl64(a, n) {
    n = n & 63;
    if (n === 0) return [a[0], a[1]];
    var l = fqShl64(a, n);
    var r = fqShr64(a, 64 - n);
    return [(l[0] | r[0]) >>> 0, (l[1] | r[1]) >>> 0];
}

function fqRotr64(a, n) {
    return fqRotl64(a, (64 - (n & 63)) & 63);
}

function fqAdd64(a, b) {
    var loSum = a[1] + b[1];
    var lo = loSum >>> 0;
    var carry = loSum >= 4294967296 ? 1 : 0;
    var hi = (a[0] + b[0] + carry) >>> 0;
    return [hi, lo];
}

function fqReadLE64(bytes, off) {
    var lo = (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0;
    var hi = (bytes[off + 4] | (bytes[off + 5] << 8) | (bytes[off + 6] << 16) | (bytes[off + 7] << 24)) >>> 0;
    return [hi, lo];
}

function fqWriteLE64(bytes, off, v) {
    bytes[off] = v[1] & 255;
    bytes[off + 1] = (v[1] >>> 8) & 255;
    bytes[off + 2] = (v[1] >>> 16) & 255;
    bytes[off + 3] = (v[1] >>> 24) & 255;
    bytes[off + 4] = v[0] & 255;
    bytes[off + 5] = (v[0] >>> 8) & 255;
    bytes[off + 6] = (v[0] >>> 16) & 255;
    bytes[off + 7] = (v[0] >>> 24) & 255;
}

var FQ_Z4_HI = 0x3dc94c3a;
var FQ_Z4_LO = 0x046d678b;

function fqSimonKeySchedule(keyBytes) {
    var key = fqToBytes(keyBytes);
    if (key.length !== 32) throw new Error("Simon key must be 32 bytes");
    var k = [];
    var i;
    for (i = 0; i < 4; i++) k.push(fqReadLE64(key, i * 8));
    for (i = 4; i < 72; i++) {
        var t = fqRotr64(k[i - 1], 3);
        t = fqXor64(t, k[i - 3]);
        t = fqXor64(t, fqRotr64(t, 1));
        var bitIndex = (i - 4) % 62;
        var zbit = bitIndex < 32 ? ((FQ_Z4_LO >>> bitIndex) & 1) : ((FQ_Z4_HI >>> (bitIndex - 32)) & 1);
        var c = fqU64(0, zbit ^ 3);
        k.push(fqXor64(fqXor64(fqNot64(k[i - 4]), t), c));
    }
    return k;
}

function fqSimonEncryptBlock(block, keys) {
    var x = block[0];
    var y = block[1];
    var i;
    for (i = 0; i < 72; i++) {
        var oldY = y;
        var f = fqAnd64(fqRotl64(y, 1), fqRotl64(y, 8));
        y = fqXor64(fqXor64(x, f), fqXor64(fqRotl64(y, 2), keys[i]));
        x = oldY;
    }
    return [x, y];
}

function fqSpeckKeySchedule(keyBytes) {
    var key = fqToBytes(keyBytes);
    if (key.length !== 32) throw new Error("Speck key must be 32 bytes");
    var ks = [fqReadLE64(key, 0)];
    var ls = [];
    var i;
    for (i = 1; i < 4; i++) ls.push(fqReadLE64(key, i * 8));
    for (i = 0; i < 33; i++) {
        var rs = fqAdd64(fqRotr64(ls[i], 8), ks[i]);
        var newL = fqXor64(fqU64(0, i), rs);
        var newK = fqXor64(newL, fqRotl64(ks[i], 3));
        ls.push(newL);
        ks.push(newK);
    }
    return ks;
}

function fqSpeckEncrypt(keyBytes, plaintextBytes) {
    var padded = fqPkcs7Pad(plaintextBytes, 16);
    var keys = fqSpeckKeySchedule(keyBytes);
    var out = new Uint8Array(padded.length);
    var off;
    for (off = 0; off < padded.length; off += 16) {
        var y = fqReadLE64(padded, off);
        var x = fqReadLE64(padded, off + 8);
        var i;
        for (i = 0; i < keys.length; i++) {
            var rs = fqAdd64(fqRotl64(x, 56), y);
            x = fqXor64(keys[i], rs);
            y = fqXor64(x, fqRotl64(y, 3));
        }
        fqWriteLE64(out, off, y);
        fqWriteLE64(out, off + 8, x);
    }
    return out;
}

function FqPbWriter() {
    this.b = [];
}

FqPbWriter.prototype.varint = function (value) {
    var x = value >>> 0;
    while (x >= 128) {
        this.b.push((x & 127) | 128);
        x = x >>> 7;
    }
    this.b.push(x & 127);
    return this;
};

FqPbWriter.prototype.key = function (field, wire) {
    return this.varint((field << 3) | wire);
};

FqPbWriter.prototype.number = function (field, value) {
    return this.key(field, 0).varint(value);
};

FqPbWriter.prototype.bytes = function (field, data) {
    var bytes = fqToBytes(data);
    this.key(field, 2).varint(bytes.length);
    var i;
    for (i = 0; i < bytes.length; i++) this.b.push(bytes[i] & 255);
    return this;
};

FqPbWriter.prototype.string = function (field, value) {
    return this.bytes(field, fqUtf8Encode(value));
};

FqPbWriter.prototype.message = function (field, cb) {
    var sub = new FqPbWriter();
    cb(sub);
    return this.bytes(field, sub.out());
};

FqPbWriter.prototype.out = function () {
    return new Uint8Array(this.b);
};

function fqQueryParam(query, key) {
    var match = new RegExp("(?:^|&)" + key + "=([^&]*)").exec(query || "");
    return match ? match[1] : "";
}

function fqSha512Bytes(data) {
    return new Uint8Array(fqSha512.array(data));
}

function fqArgus(query, stubHex, ts) {
    var deviceId = fqQueryParam(query, "device_id");
    var versionName = fqQueryParam(query, "version_name") || "7.0.1.32";
    var bodyHash = fqSm3(stubHex ? fqHexDecode(stubHex) : new Uint8Array(16));
    var queryHash = fqSm3(fqUtf8Encode(query || ""));
    var randomBytes = fqRandomBytes(4);
    var randomInt = ((randomBytes[0] | (randomBytes[1] << 8) | (randomBytes[2] << 16) | (randomBytes[3] << 24)) >>> 0) % 0x7fffffff;
    var pb = new FqPbWriter();
    pb.number(1, 0x20200929 * 2);
    pb.number(2, 2);
    pb.number(3, randomInt);
    pb.string(4, "1967");
    pb.string(5, deviceId);
    pb.string(6, "1611921764");
    pb.string(7, versionName);
    pb.string(8, "v04.04.05-ov-android");
    pb.number(9, 134744640);
    pb.bytes(10, new Uint8Array(8));
    pb.number(11, 0);
    pb.number(12, ts * 2);
    pb.bytes(13, bodyHash.subarray(0, 6));
    pb.bytes(14, queryHash.subarray(0, 6));
    pb.message(15, function (s) {
        s.number(1, 1).number(2, 1).number(3, 1).number(7, 3348294860);
    });
    pb.string(16, "");
    pb.string(20, "none");
    pb.number(21, 738);
    pb.message(23, function (s) {
        s.string(1, "NX551J").number(2, 8196).number(4, 2162219008);
    });
    pb.number(25, 2);
    var raw = pb.out();
    var padded = fqPkcs7Pad(raw, 16);
    var signHash = fqSm3(fqConcat(FQ_SIGN_KEY, new Uint8Array([0xf2, 0x81]), new Uint8Array([0x61, 0x6f]), FQ_SIGN_KEY));
    var keys = fqSimonKeySchedule(signHash);
    var enc = new Uint8Array(padded.length);
    var off;
    for (off = 0; off < padded.length; off += 16) {
        var pair = fqSimonEncryptBlock([fqReadLE64(padded, off), fqReadLE64(padded, off + 8)], keys);
        fqWriteLE64(enc, off, pair[0]);
        fqWriteLE64(enc, off + 8, pair[1]);
    }
    var data = fqConcat(new Uint8Array([0xf2, 0xf7, 0xfc, 0xff, 0xf2, 0xf7, 0xfc, 0xff]), enc);
    var i;
    for (i = 8; i < data.length; i++) data[i] ^= data[i % 8];
    var reversed = new Uint8Array(data.length);
    for (i = 0; i < data.length; i++) reversed[i] = data[data.length - 1 - i];
    var payload = fqConcat(new Uint8Array([0xa6, 0x6e, 0xad, 0x9f, 0x77, 0x01, 0xd0, 0x0c, 0x18]), reversed, new Uint8Array([0x61, 0x6f]));
    var ct = fqAesEncrypt(fqMd5(FQ_SIGN_KEY.subarray(0, 16)), fqMd5(FQ_SIGN_KEY.subarray(16, 32)), payload);
    return fqB64Encode(fqConcat(new Uint8Array([0xf2, 0x81]), ct));
}

function fqLadon(ts) {
    var random = fqRandomBytes(4);
    var plain = fqUtf8Encode(String(ts) + "-1611921764-1967");
    var key = fqUtf8Encode(fqHexEncode(fqMd5(fqConcat(random, fqUtf8Encode("1967")))));
    var enc = fqSpeckEncrypt(key, plain);
    return fqB64Encode(fqConcat(random, enc));
}

function fqSignHeaders(url, body) {
    var q = url.indexOf("?") >= 0 ? url.substring(url.indexOf("?") + 1) : "";
    var bodyBytes = null;
    if (body !== null && body !== undefined) bodyBytes = typeof body === "string" ? fqUtf8Encode(body) : fqToBytes(body);
    var stub = bodyBytes ? fqMd5Hex(bodyBytes) : "";
    var now = Date.now();
    var ts = Math.floor(now / 1000);
    var headers = {
        "x-argus": fqArgus(q, stub, ts),
        "x-ladon": fqLadon(ts),
        "x-khronos": String(ts),
        "x-ss-req-ticket": String(now)
    };
    if (bodyBytes) headers["X-SS-STUB"] = stub;
    return headers;
}

function fqEncryptTT(data) {
    var random = fqRandomBytes(32);
    var h1 = fqSha512Bytes(random);
    var h2 = fqSha512Bytes(fqConcat(h1, FQ_FIXED_STRING));
    var key = h2.subarray(0, 16);
    var iv = h2.subarray(16, 32);
    var compressed = fqGzipStore(data);
    var hashed = fqConcat(fqSha512Bytes(compressed), compressed);
    var encrypted = fqAesEncrypt(key, iv, hashed);
    return fqConcat(new Uint8Array([0x74, 0x63, 0x05, 0x10, 0x00, 0x00]), random, encrypted);
}
