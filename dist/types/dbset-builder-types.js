"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdBuilder = void 0;
class IdBuilder {
    constructor() {
        this._ids = [];
        this._keyType = "auto";
    }
    get Ids() {
        return this._ids;
    }
    get KeyType() {
        return this._keyType;
    }
    add(key) {
        this._keyType = "user-defined";
        this._ids.push(key);
        return this;
    }
    none() {
        this._keyType = "none";
        return this;
    }
    auto() {
        this._keyType = "auto";
        return this;
    }
}
exports.IdBuilder = IdBuilder;
//# sourceMappingURL=dbset-builder-types.js.map