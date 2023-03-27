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
exports.IndexApi = void 0;
class IndexApi {
    constructor(doWork) {
        this._doWork = doWork;
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doWork((w) => __awaiter(this, void 0, void 0, function* () {
                const response = yield w.getIndexes();
                return response.indexes;
            }));
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doWork((w) => __awaiter(this, void 0, void 0, function* () {
                const response = yield w.getIndexes();
                return response.indexes.find(selector);
            }));
        });
    }
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doWork((w) => __awaiter(this, void 0, void 0, function* () {
                const response = yield w.getIndexes();
                return response.indexes.filter(selector);
            }));
        });
    }
    create(creator) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doWork(w => {
                const instance = new IndexFactory();
                creator(instance);
                const ddoc = instance.DesignDocumentName;
                const name = instance.Name;
                const fields = instance.Creator.Fields;
                return w.createIndex({
                    index: {
                        fields,
                        ddoc,
                        name
                    }
                });
            });
        });
    }
    remove(index) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doWork(w => w.deleteIndex(index));
        });
    }
}
exports.IndexApi = IndexApi;
class IndexFactory {
    get Name() { return this._name; }
    get DesignDocumentName() { return this._designDocumentName; }
    get Creator() { return this._creator; }
    fields(creator) {
        const instance = new KeyFactory();
        creator(instance);
        this._creator = instance;
        return this;
    }
    designDocumentName(name) {
        this._designDocumentName = name;
        return this;
    }
    name(name) {
        this._name = name;
        return this;
    }
}
class KeyFactory {
    constructor() {
        this._fields = [];
    }
    get Fields() { return this._fields; }
    add(name) {
        this._fields.push(name);
        return this;
    }
}
//     $indexes.
//     all()
//     find()
//     create(name:string)
//         fields(w => w.add())
//     remove(name:string)
//# sourceMappingURL=IndexApi.js.map