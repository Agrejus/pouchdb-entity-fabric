import { AsyncCache } from "../cache/AsyncCache";
import { ICachedDatabases } from "../types/entity-types";
import { IDatabaseStore } from "../types/store-types";

export class InternalDatabaseStore implements IDatabaseStore {

    private _cache: AsyncCache;

    constructor(cache: AsyncCache) {
        this._cache = cache;
    }

    get IsAvailable() {
        return true;
    }

    async upsertDatabaseName(...names: string[]) {
        const dblistEntity = await this._getDatabases();

        dblistEntity.list = names;

        await this._cache.set(dblistEntity);
    }

    private async _getDatabases() {
        let dblistEntity = await this._cache.get<ICachedDatabases>("temp-db-list");

        if (dblistEntity == null) {
            dblistEntity = {
                _id: "temp-db-list",
                list: []
            };
        }

        return dblistEntity;
    }

    async getDatabaseNames() {
        const dbs = await this._getDatabases();
        return dbs.list;
    }
}