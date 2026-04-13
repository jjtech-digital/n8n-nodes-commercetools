"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = downloadFile;
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const MAX_REDIRECTS = 5;
function downloadFile(url, dest, redirectDepth = 0) {
    if (redirectDepth > MAX_REDIRECTS) {
        return Promise.reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) downloading ${url}`));
    }
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https
            .get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                const location = response.headers.location;
                if (!location) {
                    reject(new Error(`Redirect ${response.statusCode} with no Location header from ${url}`));
                    return;
                }
                downloadFile(location, dest, redirectDepth + 1)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
                file.close();
                fs.unlink(dest, () => { });
                reject(new Error(`HTTP ${response.statusCode} downloading collection from ${url}. ` +
                    `Check the URL and your network connection.`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
        })
            .on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}
//# sourceMappingURL=download.js.map