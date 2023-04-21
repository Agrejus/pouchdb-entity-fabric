import { AsyncCache } from "../cache/AsyncCache";
import { IDatabaseStore } from "../types/store-types";
export declare class InternalDatabaseStore implements IDatabaseStore {
    private _cache;
    constructor(cache: AsyncCache);
    get IsAvailable(): boolean;
    upsertDatabaseName(...names: string[]): Promise<void>;
    private _getDatabases;
    getDatabaseNames(): Promise<string[]>;
}
