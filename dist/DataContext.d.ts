/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { DataContextEvent, DataContextEventCallback, IBulkDocsResponse, IDataContext, IDbAdditionRecord, IDbRecord, IDbRecordBase, IDbSet, IDbSetBase, IdKeys } from './typings';
export declare class DataContext<TDocumentType extends string> implements IDataContext {
    protected _db: PouchDB.Database;
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: IDbRecordBase[];
    protected _removeById: string[];
    protected _collectionName: string;
    private _events;
    private _dbSets;
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    /**
     * Gets all data from the data store
     */
    protected getAllData(documentType?: TDocumentType): Promise<IDbRecordBase[]>;
    getAllDocs(): Promise<IDbRecordBase[]>;
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext(): this;
    /**
     * Inserts entity into the data store, this is used by DbSet
     * @param entity
     * @param onComplete
     */
    protected insertEntity(entity: IDbAdditionRecord<any>, onComplete?: (result: IDbRecord<any>) => void): Promise<boolean>;
    /**
     * Updates entity in the data store, this is used by DbSet
     * @param entity
     * @param onComplete
     */
    protected updateEntity(entity: IDbRecordBase, onComplete: (result: IDbRecord<any>) => void): Promise<boolean>;
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    protected bulkDocs(entities: IDbRecordBase[]): Promise<IBulkDocsResponse[]>;
    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity
     */
    protected removeEntity(entity: IDbRecordBase): Promise<boolean>;
    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity
     */
    protected removeEntityById(id: string): Promise<boolean>;
    /**
     * Get entity from the data store, this is used by DbSet
     * @param id
     */
    protected getEntity(id: string): Promise<IDbRecordBase & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta>;
    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi;
    /**
     * Used by the context api
     * @param data
     * @param matcher
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
    /**
     * Persist changes to the underlying data store
     * @returns number
     */
    saveChanges(): Promise<number>;
    protected addEntityWithoutId(entity: IDbRecordBase): Promise<IBulkDocsResponse>;
    protected createDbSet<TEntity extends IDbRecord<TDocumentType>, TAddExclusions extends keyof TEntity = any>(documentType: TDocumentType, ...idKeys: IdKeys<TEntity>): IDbSet<TDocumentType, TEntity, TAddExclusions>;
    query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>;
    hasPendingChanges(): boolean;
    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>): void;
    [Symbol.iterator](): {
        next: () => {
            value: IDbSetBase<string>;
            done: boolean;
        };
    };
}
