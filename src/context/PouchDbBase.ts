import PouchDB from 'pouchdb';

export abstract class PouchDbBase {

    protected readonly _dbOptions?: PouchDB.Configuration.DatabaseConfiguration;
    private readonly _dbName?: string;

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._dbOptions = options;
        this._dbName = name;
    }

    protected createDb() {
        return new PouchDB(this._dbName, this._dbOptions);
    }

    protected async doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose: boolean = true) {
        const db = this.createDb();
        const result = await action(db);

        if (shouldClose) {
            await db.close();
        }

        return result;
    }
}