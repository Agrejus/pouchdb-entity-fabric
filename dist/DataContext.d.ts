/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { DataContextEvent, DataContextEventCallback, DataContextOptions, EntityIdKeys, IBulkDocsResponse, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetBase, IPurgeResponse } from './typings';
import { AdvancedDictionary } from './AdvancedDictionary';
import { DbSetBuilder } from './DbSetBuilder';
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
     * Get entity from the data store, this is used by DbSet
     * @param ids
     */
    protected get(...ids: string[]): Promise<IDbRecordBase[]>;
    /**
     * Gets all data from the data store
     */
    protected getAllData(documentType?: TDocumentType): Promise<IDbRecordBase[]>;
}
export declare class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {
    static PROXY_MARKER: string;
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: AdvancedDictionary<IDbRecordBase>;
    protected _removeById: string[];
    private _configuration;
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
    private addDbSet;
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
    private _makeTrackable;
    private _getPendingChanges;
    private _tryCallEvents;
    private _makePristine;
    private _getModifications;
    saveChanges(): Promise<number>;
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns DbSetBuilder
     */
    protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType): DbSetBuilder<TDocumentType, TEntity, never>;
    /**
     * Create a DbSet
     * @param documentType Document Type for the entity
     * @param idKeys IdKeys for tyhe entity
     * @deprecated Use {@link dbset} instead.
     */
    protected createDbSet<TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never>(documentType: TDocumentType, ...idKeys: EntityIdKeys<TDocumentType, TEntity>): IDbSet<TDocumentType, TEntity, TExtraExclusions>;
    query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>;
    hasPendingChanges(): boolean;
    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>): void;
    empty(): Promise<void>;
    destroyDatabase(): Promise<void>;
    purge(purgeType?: "memory" | "disk"): Promise<IPurgeResponse>;
    static asUntracked(...entities: IDbRecordBase[]): {
        _id: string;
        _rev: string;
        DocumentType: any;
    }[];
    static isProxy(entities: IDbRecordBase): boolean;
    [Symbol.iterator](): {
        next: () => {
            value: IDbSetBase<string>;
            done: boolean;
        };
    };
}
export {};
