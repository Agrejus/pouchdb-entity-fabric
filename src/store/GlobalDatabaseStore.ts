import { IDatabaseStore } from "../types/store-types";

export class GlobalDatabaseStore implements IDatabaseStore {

    get IsAvailable() {
        return typeof global !== 'undefined' && 'indexedDB' in global && 'databases' in global.indexedDB
    }

    async upsertDatabaseName(...name: string[]) {
        // no op
    }

    async getDatabaseNames() {
        if (this.IsAvailable === false) {
            return []
        }

        const databases = await  global.indexedDB.databases()
        return databases.filter(w => !!w.name).map(w => w.name!);
    }
}