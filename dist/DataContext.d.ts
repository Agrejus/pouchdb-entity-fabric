/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { DataContextEvent, DataContextEventCallback, DataContextOptions, IBulkDocsResponse, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetBase, IPreviewChanges, IPurgeResponse, IQueryParams } from './typings';
import { AdvancedDictionary } from './AdvancedDictionary';
import { DbSetBuilder } from './DbSetBuilder';
import { IIndexApi } from './IndexApi';
export interface IContextCache {
    upsert(key: string, value: any): void;
    remove(key: string): void;
}
declare abstract class PouchDbBase {
    protected readonly _dbOptions?: PouchDB.Configuration.DatabaseConfiguration;
    private readonly _dbName?;
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    protected createDb(): PouchDB.Database<{}>;
    protected doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose?: boolean): Promise<T>;
}
declare abstract class PouchDbInteractionBase<TDocumentType extends string> extends PouchDbBase {
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    protected bulkDocs(entities: IDbRecordBase[]): Promise<{
        errors: {
            [key: string]: IBulkDocsResponse;
        };
        errors_count: number;
        successes: {
            [key: string]: IBulkDocsResponse;
        };
        successes_count: number;
    }>;
    /**
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids
     */
    protected getStrict(...ids: string[]): Promise<IDbRecordBase[]>;
    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids
     */
    protected get(...ids: string[]): Promise<IDbRecordBase[]>;
    /**
     * Gets all data from the data store
     */
    protected getAllData(payload?: IQueryParams<TDocumentType>): Promise<IDbRecordBase[]>;
}
export declare class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {
    static PROXY_MARKER: string;
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: AdvancedDictionary<IDbRecordBase>;
    protected _purges: IDbRecordBase[];
    protected _removeById: string[];
    private _configuration;
    $indexes: IIndexApi;
    private _events;
    private _dbSets;
    constructor(name?: string, options?: DataContextOptions);
    getAllDocs(): Promise<IDbRecordBase[]>;
    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns void
     */
    optimize(): Promise<void>;
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext(): this;
    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi;
    private _addDbSet;
    /**
     * Used by the context api
     * @param data
     */
    private _detach;
    /**
     * Used by the context api
     * @param data
     */
    private _sendData;
    /**
     * Used by the context api
     */
    private _getTrackedData;
    private _reinitialize;
    /**
     * Provides equality comparison for Entities
     * @param first
     * @param second
     * @returns boolean
     */
    private areEqual;
    private _map;
    private _makeTrackable;
    private _getPendingChanges;
    previewChanges(): Promise<IPreviewChanges>;
    private _tryCallPostSaveEvents;
    private _callEvents;
    private _makePristine;
    private _getModifications;
    private _purgeDocument;
    saveChanges(): Promise<number>;
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns DbSetBuilder
     */
    protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType): DbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity, never>>;
    query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>;
    hasPendingChanges(): boolean;
    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>): void;
    empty(): Promise<void>;
    destroyDatabase(): Promise<void>;
    purge(purgeType?: "memory" | "disk"): Promise<IPurgeResponse>;
    static asUntracked<T extends IDbRecordBase>(...entities: IDbRecordBase[]): T[];
    static isProxy(entities: IDbRecordBase): boolean;
    static isDate(value: any): boolean;
    static merge<T extends IDbRecordBase>(to: T, from: T, options?: {
        skip?: string[];
    }): void;
    [Symbol.iterator](): {
        next: () => {
            value: IDbSetBase<string>;
            done: boolean;
        };
    };
}
export {};
