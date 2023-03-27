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
exports.DbSet = void 0;
const AdapterFactory_1 = require("../../adapters/AdapterFactory");
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
class DbSet {
    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props) {
        const adapterFactory = new AdapterFactory_1.AdapterFactory(props);
        this._indexAdapter = adapterFactory.createIndexAdapter();
        this._fetchAdapter = adapterFactory.createFetchAdapter(this._indexAdapter);
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter(this._indexAdapter);
    }
    info() {
        return this._generalAdapter.info();
    }
    instance(...entities) {
        return this._modificationAdapter.instance(...entities);
    }
    add(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._modificationAdapter.add(...entities);
        });
    }
    upsert(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._modificationAdapter.upsert(...entities);
        });
    }
    remove(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._modificationAdapter.remove(...entities);
        });
    }
    useIndex(name) {
        this._indexAdapter.useIndex(name);
        return this;
    }
    empty() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._modificationAdapter.empty();
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchAdapter.all();
        });
    }
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchAdapter.filter(selector);
        });
    }
    isMatch(first, second) {
        return this._generalAdapter.isMatch(first, second);
    }
    match(...items) {
        return this._generalAdapter.match(...items);
    }
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchAdapter.get(...ids);
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchAdapter.find(selector);
        });
    }
    unlink(...entities) {
        this._generalAdapter.unlink(...entities);
    }
    markDirty(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._generalAdapter.markDirty(...entities);
        });
    }
    link(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._generalAdapter.link(...entities);
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchAdapter.first();
        });
    }
}
exports.DbSet = DbSet;
//# sourceMappingURL=DbSet.js.map