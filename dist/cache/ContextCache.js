"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
class ContextCache {
    constructor() {
        this._data = {};
    }
    upsert(key, value) {
        this._data[key] = value;
    }
    remove(key) {
        delete this._data[key];
    }
    get(key) {
        return this._data[key];
    }
    contains(key) {
        return this._data[key] != null;
    }
}
exports.cache = new ContextCache();
//# sourceMappingURL=ContextCache.js.map