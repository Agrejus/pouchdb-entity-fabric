"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedDictionary = void 0;
class AdvancedDictionary {
    constructor(key) {
        this._data = {};
        this._enumeration = [];
        this._length = 0;
        this._key = key;
    }
    get length() {
        return this._length;
    }
    push(...items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const key = item[this._key];
            if (!this._data[key]) {
                this._data[key] = [];
            }
            this._data[key].push(item);
        }
        this._length += items.length;
        this._enumeration = [];
    }
    get(...entities) {
        const result = [];
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const key = entity[this._key];
            const items = this._data[key];
            if (items != null) {
                result.push(...items);
            }
        }
        return result;
    }
    remove(...entities) {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const key = entity[this._key];
            delete this._data[key];
        }
        this._length -= entities.length;
        this._enumeration = [];
    }
    filter(predicate) {
        if (this._enumeration.length === 0) {
            for (let key in this._data) {
                const data = this._data[key];
                this._enumeration.push(...data);
            }
        }
        return this._enumeration.filter(predicate);
    }
}
exports.AdvancedDictionary = AdvancedDictionary;
//# sourceMappingURL=AdvancedDictionary.js.map