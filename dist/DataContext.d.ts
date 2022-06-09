/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { DataContextEvent, DataContextEventCallback, DataContextOptions, EntityIdKeys, IBulkDocsResponse, IDataContext, IDbAdditionRecord, IDbRecord, IDbRecordBase, IDbSet, IDbSetBase } from './typings';
declare abstract class PouchDbBase {
    private _options?;
    private _name?;
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    protected doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose?: boolean): Promise<T>;
}
declare abstract class PouchDbInteractionBase<TDocumentType extends string> extends PouchDbBase {
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    /**
    * Inserts entity into the data store, this is used by DbSet
    * @param entities
    * @param onComplete
    */
    protected insertEntity(onComplete: (result: IDbRecord<any>) => void, ...entities: IDbAdditionRecord<any>[]): Promise<boolean[]>;
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
     * Remove entity in the data store, this is used by DbSet
     * @param entity
     */
    protected removeEntity(...entity: IDbRecordBase[]): Promise<boolean>;
    /**
     * Remove entity in the data store, this is used by DbSet
     * @param ids
     */
    protected removeEntityById(onResponse: (entity: IDbRecordBase) => void, ...ids: string[]): Promise<boolean[]>;
    protected removeEntityById2(onResponse: (entity: IDbRecordBase) => void, ...ids: string[]): Promise<boolean[]>;
    /**
     * Get entity from the data store, this is used by DbSet
     * @param id
     */
    protected getEntity(id: string): Promise<IDbRecordBase & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta>;
    /**
     * Gets all data from the data store
     */
    protected getAllData(documentType?: TDocumentType): Promise<IDbRecordBase[]>;
}
export declare class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: IDbRecordBase[];
    protected _removeById: string[];
    private _configuration;
    private _events;
    private _dbSets;
    constructor(name?: string, options?: DataContextOptions);
    getAllDocs(): Promise<IDbRecordBase[]>;
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext(): this;
    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi;
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
    private _setAttachments;
    /**
     * Used by the context api
     */
    private _getTrackedData;
    private reinitialize;
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
    private _tryCreateDocumentTypeIndex;
    generateDocumentTypeIndex(): Promise<void>;
    saveChanges(): Promise<number>;
    protected addEntityWithoutId(onComplete: (result: IDbRecord<any>) => void, ...entities: IDbRecordBase[]): Promise<boolean[]>;
    protected createDbSet<TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) | void = void>(documentType: TDocumentType, ...idKeys: EntityIdKeys<TDocumentType, TEntity>): IDbSet<TDocumentType, TEntity, TExtraExclusions>;
    query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>;
    hasPendingChanges(): boolean;
    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>): void;
    destroyDatabase(): Promise<void>;
    [Symbol.iterator](): {
        next: () => {
            value: IDbSetBase<string>;
            done: boolean;
        };
    };
}
export {};
