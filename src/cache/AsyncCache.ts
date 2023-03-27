import PouchDB from 'pouchdb';
import { ICacheDocumentBase } from '../types/entity-types';

export class AsyncCache {

    private CACHE_DB_NAME = "__PEF_CACHE_v1";

    private _getDb() {
        return new PouchDB(this.CACHE_DB_NAME);
    }

    async get<TDocument extends ICacheDocumentBase>(key: string): Promise<TDocument | null> {
        try {
            const result = await this._getDb().get(key);

            return result as any;
        } catch {
            return null
        }
    }

    async destroy() {
        await this._getDb().destroy();
    }

    async set<TDocument extends ICacheDocumentBase>(document: TDocument) {
        try {
            const result = await this._getDb().put(document);

            return result.ok
        } catch {
            return false
        }
    }
}