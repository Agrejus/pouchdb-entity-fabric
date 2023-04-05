"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexStore = void 0;
class IndexStore {
    constructor(defaultName) {
        this._default = null;
        this._once = null;
        this._default = defaultName;
    }
    once(name) {
        this._once = name;
    }
    get() {
        if (this._once) {
            const result = this._once;
            this._once = null;
            return result;
        }
        return this._default;
    }
}
exports.IndexStore = IndexStore;
//# sourceMappingURL=IndexStore.js.map