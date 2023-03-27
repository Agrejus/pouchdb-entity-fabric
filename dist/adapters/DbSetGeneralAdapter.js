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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetGeneralAdapter = void 0;
const DataContext_1 = require("../context/DataContext");
const Validation_1 = require("../validation/Validation");
const DbSetBaseAdapter_1 = require("./DbSetBaseAdapter");
class DbSetGeneralAdapter extends DbSetBaseAdapter_1.DbSetBaseAdapter {
    constructor(props) {
        super(props);
    }
    isMatch(first, second) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }
    match(...items) {
        return items.filter(w => w.DocumentType === this.documentType);
    }
    info() {
        const info = {
            DocumentType: this.documentType,
            IdKeys: this.idKeys,
            Defaults: this.defaults,
            KeyType: this.keyType,
            Readonly: this.isReadonly,
            Map: this.map
        };
        return info;
    }
    merge(from, to) {
        var _a;
        return Object.assign(Object.assign(Object.assign({}, from), to), { [this.api.PRISTINE_ENTITY_KEY]: Object.assign(Object.assign({}, from), ((_a = to[this.api.PRISTINE_ENTITY_KEY]) !== null && _a !== void 0 ? _a : {})), _rev: from._rev });
    }
    unlink(...entities) {
        const validationFailures = entities.map(w => (0, Validation_1.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n');
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`);
        }
        this._detachItems(entities);
    }
    markDirty(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entities.some(w => DataContext_1.DataContext.isProxy(w) === false)) {
                throw new Error(`Entities must be linked to context in order to mark as dirty`);
            }
            return entities.map(w => {
                w[this.api.DIRTY_ENTITY_MARKER] = true;
                return w;
            });
        });
    }
    link(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationFailures = entities.map(w => (0, Validation_1.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
            if (validationFailures.length > 0) {
                const errors = validationFailures.map(w => w.error).join('\r\n');
                throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`);
            }
            // Find the existing _rev just in case it's not in sync
            const found = yield this.api.getStrict(...entities.map(w => w._id));
            const foundDictionary = found.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v._rev })), {});
            const result = entities.map(w => this.api.makeTrackable(Object.assign(Object.assign({}, w), { _rev: foundDictionary[w._id] }), this.defaults.add, this.isReadonly, this.map));
            this.api.send(result);
            return result;
        });
    }
    _detachItems(data) {
        return this.api.detach(data);
    }
}
exports.DbSetGeneralAdapter = DbSetGeneralAdapter;
//# sourceMappingURL=DbSetGeneralAdapter.js.map