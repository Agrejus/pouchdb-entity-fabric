"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncCache = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
class AsyncCache {
    constructor() {
        this.CACHE_DB_NAME = "__PEF_CACHE_v1";
    }
    _getDb() {
        return new pouchdb_1.default(this.CACHE_DB_NAME);
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this._getDb().get(key);
                return result;
            }
            catch (_a) {
                return null;
            }
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._getDb().destroy();
        });
    }
    set(document) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this._getDb().put(document);
                return result.ok;
            }
            catch (_a) {
                return false;
            }
        });
    }
}
exports.AsyncCache = AsyncCache;
//# sourceMappingURL=AsyncCache.js.map