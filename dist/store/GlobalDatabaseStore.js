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
exports.GlobalDatabaseStore = void 0;
class GlobalDatabaseStore {
    get IsAvailable() {
        return typeof global !== 'undefined' && 'indexedDB' in global && 'databases' in global.indexedDB;
    }
    upsertDatabaseName(...name) {
        return __awaiter(this, void 0, void 0, function* () {
            // no op
        });
    }
    getDatabaseNames() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.IsAvailable === false) {
                return [];
            }
            const databases = yield global.indexedDB.databases();
            return databases.filter(w => !!w.name).map(w => w.name);
        });
    }
}
exports.GlobalDatabaseStore = GlobalDatabaseStore;
//# sourceMappingURL=GlobalDatabaseStore.js.map