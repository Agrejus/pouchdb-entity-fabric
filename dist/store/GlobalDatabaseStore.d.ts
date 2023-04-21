import { IDatabaseStore } from "../types/store-types";
export declare class GlobalDatabaseStore implements IDatabaseStore {
    get IsAvailable(): boolean;
    upsertDatabaseName(...name: string[]): Promise<void>;
    getDatabaseNames(): Promise<string[]>;
}
