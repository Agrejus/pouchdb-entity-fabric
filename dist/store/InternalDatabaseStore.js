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
exports.InternalDatabaseStore = void 0;
class InternalDatabaseStore {
    constructor(cache) {
        this._cache = cache;
    }
    get IsAvailable() {
        return true;
    }
    upsertDatabaseName(...names) {
        return __awaiter(this, void 0, void 0, function* () {
            const dblistEntity = yield this._getDatabases();
            dblistEntity.list = names;
            yield this._cache.set(dblistEntity);
        });
    }
    _getDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            let dblistEntity = yield this._cache.get("temp-db-list");
            if (dblistEntity == null) {
                dblistEntity = {
                    _id: "temp-db-list",
                    list: []
                };
            }
            return dblistEntity;
        });
    }
    getDatabaseNames() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this._getDatabases();
            return dbs.list;
        });
    }
}
exports.InternalDatabaseStore = InternalDatabaseStore;
//# sourceMappingURL=InternalDatabaseStore.js.map