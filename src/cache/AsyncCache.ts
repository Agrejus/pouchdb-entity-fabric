import PouchDB from 'pouchdb';
import { ICacheDocumentBase } from '../types/entity-types';

export class AsyncCache {

    private CACHE_DB_NAME = "__PEF_CACHE_v1";

    private _getDb() {
        return new PouchDB(this.CACHE_DB_NAME);
    }

    async get<TDocument extends ICacheDocumentBase>(key: string): Promise<TDocument | null> {
        try {

            const result = await this._getDb().find({
                selector: {
                    _id: key
                }
            });

            if (result.docs.length === 0) {
                return null;
            }

            return result.docs[0] as any;
        } catch {
            return null
        }
    }

    async remove(key: string): Promise<boolean> {
        try {
            const db = this._getDb();
            const doc = await db.get(key);
            const result = await db.remove(doc);

            return result.ok;
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