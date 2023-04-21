import { IDatabaseStore } from "../types/store-types";
export declare class WindowDatabaseStore implements IDatabaseStore {
    get IsAvailable(): boolean;
    upsertDatabaseName(...name: string[]): Promise<void>;
    getDatabaseNames(): Promise<string[]>;
}
