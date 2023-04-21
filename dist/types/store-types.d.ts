export interface IDatabaseStore {
    upsertDatabaseName(...name: string[]): Promise<void>;
    getDatabaseNames(): Promise<string[]>;
    get IsAvailable(): boolean;
}
