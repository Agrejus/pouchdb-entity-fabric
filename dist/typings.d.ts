/// <reference types="pouchdb-core" />
import { AdvancedDictionary } from './AdvancedDictionary';
export interface IDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) | void = void> extends IDbSetBase<TDocumentType> {
    /**
     * Add one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities
     */
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    /**
     * Remove one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities
     */
    remove(...entities: TEntity[]): Promise<void>;
    /**
     * Remove one or more entities by id from the underlying data context, saveChanges must be called to persist these items to the store
     * @param ids
     */
    remove(...ids: string[]): Promise<void>;
    /**
     * Return all items in the underlying data store for the document type
     * @returns TEntity[]
     */
    all(): Promise<TEntity[]>;
    /**
     * Filter items in the underlying data store and return the results
     * @param selector
     * @returns Promise<TEntity[]>
     */
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    /**
     * Find first item matching the selector in the underlying data store and return the result
     * @param selector
     * @returns TEntity
     */
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    /**
     * Find entity by an id or ids
     * @param ids
     * @returns TEntity
     */
    get(...ids: string[]): Promise<TEntity[]>;
    /**
     * Check for equality between two entities
     * @param first
     * @param second
     * @returns boolean
     */
    isMatch(first: TEntity, second: TEntity): boolean;
    /**
     * Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store
     * @param entities
     */
    unlink(...entities: TEntity[]): void;
    /**
     * Link an existing entitiy or entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites
     */
    link(...entites: TEntity[]): void;
    /**
     * Matches items with the same document type
     * @param entities
     * @returns TEntity[]
     */
    match(entities: IDbRecordBase[]): TEntity[];
    /**
     * Find first item in the underlying data store and return the result
     * @returns TEntity
     */
    first(): Promise<TEntity>;
    /**
     * Attach callback event to the DbSet
     * @param event
     * @param callback
     * @returns void
     */
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>): void;
}
export declare type OmittedEntity<TEntity, TExtraExclusions extends (keyof TEntity) | void = void> = TExtraExclusions extends keyof TEntity ? Omit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions> : Omit<TEntity, "_id" | "_rev" | "DocumentType">;
export declare type DataContextEventCallback<TDocumentType> = ({ DocumentType }: {
    DocumentType: TDocumentType;
}) => void;
export declare type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';
export declare type DbSetEventCallback<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => void;
export declare type DbSetIdOnlyEventCallback = (entity: string) => void;
export declare type DbSetEvent = "add" | "remove";
export declare type KeyOf<T> = keyof T;
export declare type IdKeys<T> = KeyOf<T>[];
export declare type EntityIdKeys<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = IdKeys<Omit<TEntity, "_id" | "_rev">>;
export interface IIndexableEntity<T extends any = any> {
    [key: string]: T;
}
export interface IDbSetBase<TDocumentType extends string> {
    get DocumentType(): TDocumentType;
    /**
     * Remove all entities from the underlying data context, saveChanges must be called to persist these changes to the store
     */
    empty(): Promise<void>;
}
export declare type DatabaseConfigurationAdditionalConfiguration = {};
export declare type DataContextOptions = PouchDB.Configuration.DatabaseConfiguration & DatabaseConfigurationAdditionalConfiguration;
export declare type EntitySelector<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity, index?: number, array?: TEntity[]) => boolean;
export interface IDbSetApi<TDocumentType extends string> {
    getTrackedData: () => ITrackedData;
    getAllData: (documentType: TDocumentType) => Promise<IDbRecordBase[]>;
    get: (...ids: string[]) => Promise<IDbRecordBase[]>;
    send: (data: IDbRecordBase[], shouldThrowOnDuplicate: boolean) => void;
    detach: (data: IDbRecordBase[]) => IDbRecordBase[];
    makeTrackable<T extends Object>(entity: T): T;
}
export interface IDbRecord<TDocumentType> extends IDbAdditionRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}
export interface IDbAdditionRecord<T> {
    readonly DocumentType: T;
}
export interface IDbRecordBase extends IDbRecord<any> {
}
export interface IBulkDocsResponse {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}
export interface IDataContext {
    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns number
     */
    saveChanges(): Promise<number>;
    /**
     * Get all documents in the underlying data store
     * @returns IDbRecordBase[]
     */
    getAllDocs(): Promise<IDbRecordBase[]>;
    /**
     * Check to see if there are any unsaved changes
     * @returns boolean
     */
    hasPendingChanges(): boolean;
    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns void
     */
    optimize(): Promise<void>;
    /**
     * Remove all entities from all DbSets in the data context, saveChanges must be called to persist these changes to the store
     * @returns void
     */
    empty(): Promise<void>;
    /**
     * Destroy Pouch Database
     * @returns void
     */
    destroyDatabase(): Promise<void>;
    purge(purgeType: "memory" | "disk"): Promise<{
        doc_count: number;
        loss_count: number;
    }>;
}
export interface ITrackedData {
    add: IDbRecordBase[];
    remove: IDbRecordBase[];
    attach: AdvancedDictionary<IDbRecordBase>;
    removeById: string[];
}
