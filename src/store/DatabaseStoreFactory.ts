import { AsyncCache } from "../cache/AsyncCache";
import { IDatabaseStore } from "../types/store-types";
import { GlobalDatabaseStore } from "./GlobalDatabaseStore";
import { InternalDatabaseStore } from "./InternalDatabaseStore";
import { WindowDatabaseStore } from "./WindowDatabaseStore";

export class DatabaseStoreFactory {

    static getDataStore(cache: AsyncCache): IDatabaseStore {
        const windowDatabaseStore = new WindowDatabaseStore();
        const globalDatabaseStore = new GlobalDatabaseStore();
        const internalDatabaseStore = new InternalDatabaseStore(cache);

        if (windowDatabaseStore.IsAvailable) {
            return windowDatabaseStore;
        }

        if (globalDatabaseStore.IsAvailable) {
            return globalDatabaseStore;
        }

        return internalDatabaseStore;
    }
}