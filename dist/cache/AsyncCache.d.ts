import { ICacheDocumentBase } from '../types/entity-types';
export declare class AsyncCache {
    private CACHE_DB_NAME;
    private _getDb;
    get<TDocument extends ICacheDocumentBase>(key: string): Promise<TDocument | null>;
    remove(key: string): Promise<boolean>;
    destroy(): Promise<void>;
    set<TDocument extends ICacheDocumentBase>(document: TDocument): Promise<boolean>;
}
