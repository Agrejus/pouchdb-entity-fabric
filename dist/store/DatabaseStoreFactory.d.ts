import { AsyncCache } from "../cache/AsyncCache";
import { IDatabaseStore } from "../types/store-types";
export declare class DatabaseStoreFactory {
    static getDataStore(cache: AsyncCache): IDatabaseStore;
}
