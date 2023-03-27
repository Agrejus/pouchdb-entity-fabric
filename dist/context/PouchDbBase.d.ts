/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
export declare abstract class PouchDbBase {
    protected readonly _dbOptions?: PouchDB.Configuration.DatabaseConfiguration;
    private readonly _dbName?;
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    protected createDb(): PouchDB.Database<{}>;
    protected doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose?: boolean): Promise<T>;
}
