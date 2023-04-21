"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseStoreFactory = void 0;
const GlobalDatabaseStore_1 = require("./GlobalDatabaseStore");
const InternalDatabaseStore_1 = require("./InternalDatabaseStore");
const WindowDatabaseStore_1 = require("./WindowDatabaseStore");
class DatabaseStoreFactory {
    static getDataStore(cache) {
        const windowDatabaseStore = new WindowDatabaseStore_1.WindowDatabaseStore();
        const globalDatabaseStore = new GlobalDatabaseStore_1.GlobalDatabaseStore();
        const internalDatabaseStore = new InternalDatabaseStore_1.InternalDatabaseStore(cache);
        if (windowDatabaseStore.IsAvailable) {
            return windowDatabaseStore;
        }
        if (globalDatabaseStore.IsAvailable) {
            return globalDatabaseStore;
        }
        return internalDatabaseStore;
    }
}
exports.DatabaseStoreFactory = DatabaseStoreFactory;
//# sourceMappingURL=DatabaseStoreFactory.js.map