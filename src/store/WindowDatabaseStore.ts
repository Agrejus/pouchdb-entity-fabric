import { IDatabaseStore } from "../types/store-types";

export class WindowDatabaseStore implements IDatabaseStore {

    get IsAvailable() {
        return typeof window !== 'undefined' && 'indexedDB' in window && 'databases' in window.indexedDB
    }

    async upsertDatabaseName(...name: string[]) {
        // no op
    }

    async getDatabaseNames() {
        if (this.IsAvailable === false) {
            return []
        }

        const databases = await  window.indexedDB.databases()
        return databases.filter(w => !!w.name).map(w => w.name!);
    }
}