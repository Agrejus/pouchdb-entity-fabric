import PouchDB from 'pouchdb';
import { AdvancedDictionary } from './AdvancedDictionary';
import { DbSetKeyType, PropertyMap } from './DbSetBuilder';

export interface IDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends IDbSetBase<TDocumentType> {

    /**
     * Add one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to add to the data context
     * @returns Promise\<TEntity[]\>
     */
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;

    /**
     * Create one or more entities and do not add it to the underlying data context.  This is useful for creating entities and passing them to other functions.
     * Call {@link add} to add the entity to a context for persistance
     * @param entities Entity or entities to create
     * @returns TEntity[]
     */
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];

    /**
     * Remove one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to remove from the data context
     * @returns Promise\<void\>
     */
    remove(...entities: TEntity[]): Promise<void>;

    /**
     * Remove one or more entities by id from the underlying data context, saveChanges must be called to persist these items to the store
     * @param ids Entity id or ids to remove from the data context
     * @returns Promise\<void\>
     */
    remove(...ids: string[]): Promise<void>;

    /**
     * Return all items in the underlying data store for the document type
     * @returns Promise\<TEntity[]\>
     */
    all(): Promise<TEntity[]>;

    /**
     * Filter items in the underlying data store and return the results
     * @param selector Callback to filter entities matching the criteria
     * @returns Promise\<TEntity[]\>
     */
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;

    /**
     * Find first item matching the selector in the underlying data store and return the result
     * @param selector Callback to find entity matching the criteria
     * @returns Promise\<TEntity \| undefined\>
     */
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;

    /**
     * Find entity by an id or ids
     * @param ids ids of the documents to retrieve
     * @returns Promise<\TEntity[]\>
     */
    get(...ids: string[]): Promise<TEntity[]>

    /**
     * Check for equality between two entities
     * @param first First entity to compare
     * @param second Second entity to compare
     * @returns boolean
     */
    isMatch(first: TEntity, second: TEntity): boolean;

    /**
     * Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store
     * @param entities Entity or entities to unlink from the data context
     */
    unlink(...entities: TEntity[]): void;

    /**
     * Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store
     * @param entities Entity or entities to unlink from the data context
     * @deprecated Use {@link unlink} instead.
     */
    detach(...entities: TEntity[]): void;

    /**
     * Link an existing entitiy or entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites Entity or entities to link from the data context
     */
    link(...entites: TEntity[]): Promise<TEntity[]>;

    /**
     * Link an existing entitiy or entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites Entity or entities to link from the data context
     * @deprecated Use {@link link} instead.
     */
    attach(...entites: TEntity[]): Promise<void>;


    /**
     * Matches items with the same document type.  Useful for retrieving all docs and calling match() to find the ones that belong in the db set
     * @param entities Entity or entities to match on document type.
     * @returns TEntity[]
     */
    match(...entities: IDbRecordBase[]): TEntity[];

    /**
     * Find first item in the underlying data store and return the result 
     * @returns Promise\<TEntity\>
     */
    first(): Promise<TEntity | undefined>;

    /**
     * Attach callback event to the DbSet
     * @param event
     * @param callback 
     * @returns void
     */
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>): void;

    /**
     * Get DbSet info
     * @returns IDbSetInfo
     */
    info(): IDbSetInfo<TDocumentType, TEntity>
}

export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    DocumentType: TDocumentType,
    IdKeys: EntityIdKeys<TDocumentType, TEntity>,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>,
    KeyType: DbSetKeyType;
    Map: PropertyMap<TDocumentType, TEntity, any>[];
    Readonly: boolean;
}

export type Work = <T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose?: boolean) => Promise<T>

export interface IDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    documentType: TDocumentType,
    context: IDataContext,
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>,
    idKeys: EntityIdKeys<TDocumentType, TEntity>;
    readonly: boolean;
    keyType: DbSetKeyType;
    events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
    asyncEvents: { [key in DbSetAsyncEvent]: (DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync)[] };
    map: PropertyMap<TDocumentType, TEntity, any>[]
}

export type OmittedEntity<TEntity, TExtraExclusions extends (keyof TEntity) = never> = Omit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions>;

export type DataContextEventCallback<TDocumentType> = ({ DocumentType }: { DocumentType: TDocumentType }) => void;
export type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';

export type DbSetEventCallback<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => void;
export type DbSetIdOnlyEventCallback = (entity: string) => void;

export type DbSetEventCallbackAsync<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entities: TEntity[]) => Promise<void>;
export type DbSetIdOnlyEventCallbackAsync = (entities: string[]) => Promise<void>;

export type DbSetEvent = "add" | "remove";
export type DbSetAsyncEvent = "add-invoked" | "remove-invoked";

export type DocumentKeySelector<T> = (entity: T) => any
export type KeyOf<T> = keyof T | DocumentKeySelector<T>;
export type IdKeys<T> = KeyOf<T>[];
export type IdKey<T> = KeyOf<T>;
export type EntityIdKeys<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = EntityIdKey<TDocumentType, TEntity>[];
export type EntityIdKey<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = IdKey<Omit<TEntity, "_id" | "_rev" | "DocumentType">>;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DbSetActionDictionaryOptional<T> = DbSetActionDictionaryRequired<T> | { add: T } | { retrieve: T };
export type DbSetActionDictionaryRequired<T> = { add: T, retrieve: T };
export type DbSetPickDefaultActionOptional<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = DbSetActionDictionaryOptional<DeepPartial<OmittedEntity<TEntity>>>;
export type DbSetPickDefaultActionRequired<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = DbSetActionDictionaryRequired<DeepPartial<OmittedEntity<TEntity>>>;

export interface IIndexableEntity<T extends any = any> {
    [key: string]: T;
}

export interface IDbSetBase<TDocumentType extends string> {

    /**
     * Get the Document Type for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get DocumentType(): TDocumentType;

    /**
     * Remove all entities from the underlying data context, saveChanges must be called to persist these changes to the store
     */
    empty(): Promise<void>;
}

export type DatabaseConfigurationAdditionalConfiguration = {

}

export type DataContextOptions = PouchDB.Configuration.DatabaseConfiguration & DatabaseConfigurationAdditionalConfiguration

export type EntitySelector<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity, index?: number, array?: TEntity[]) => boolean

export interface IDbSetApi<TDocumentType extends string> {
    getTrackedData: () => ITrackedData;
    getAllData: (documentType: TDocumentType) => Promise<IDbRecordBase[]>;
    get: (...ids: string[]) => Promise<IDbRecordBase[]>;
    send: (data: IDbRecordBase[], shouldThrowOnDuplicate: boolean) => void;
    detach: (data: IDbRecordBase[]) => IDbRecordBase[];
    makeTrackable<T extends Object>(entity: T, defaults: DeepPartial<OmittedEntity<T>>, readonly: boolean, maps: PropertyMap<any, any, any>[]): T;
}

export interface IDbRecord<TDocumentType extends string> extends IDbAdditionRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}

export interface IDbAdditionRecord<TDocumentType extends string> {
    readonly DocumentType: TDocumentType;
}

export interface IDbRecordBase extends IDbRecord<any> {

}

export interface IBulkDocsResponse {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}

export interface IPurgeResponse {
    doc_count: number;
    loss_count: number;
}

export interface IDataContext {

    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns Promise\<number\>
     */
    saveChanges(): Promise<number>;

    /**
     * Get all documents in the underlying data store
     * @returns Promise\<IDbRecordBase[]\>
     */
    getAllDocs(): Promise<IDbRecordBase[]>;

    /**
     * Check to see if there are any unsaved changes
     * @returns boolean
     */
    hasPendingChanges(): boolean;

    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns Promise\<void\>
     */
    optimize(): Promise<void>;

    /**
     * Remove all entities from all DbSets in the data context, saveChanges must be called to persist these changes to the store
     * @returns Promise\<void\>
     */
    empty(): Promise<void>;

    /**
     * Destroy Pouch Database
     * @returns Promise\<void\>
     */
    destroyDatabase(): Promise<void>;

    /**
     * Will purge all _deleted documents from the data
     * @param purgeType "memory" purge will replicate to an in-memory db, then back to the original db.  "disk" will replicate to a new db on the device and then back to the original db.  There is less chance for data loss with "disk" vs "memory" if the app were to be closed or crash during replication.
     * @returns Promise\<IPurgeResponse\>
     */
    purge(purgeType: "memory" | "disk"): Promise<IPurgeResponse>

    /**
     * Will list changes that will be persisted.  Changes are add, remove, update.  NOTE:  This is a copy of the changes, changes made will not be persisted
     * @returns Promise\<IPreviewChanges\>
     */
    previewChanges(): Promise<IPreviewChanges>
}

export interface ITrackedData {
    add: IDbRecordBase[];
    remove: IDbRecordBase[];
    attach: AdvancedDictionary<IDbRecordBase>;
    removeById: string[]
}

export type DeepReadOnly<T> = { readonly [key in keyof T]: DeepReadOnly<T[key]> };

export type IRemovalRecord = IDbRecordBase & { _deleted: boolean };
export interface IPreviewChanges {
    add: IDbRecordBase[];
    remove: IRemovalRecord[];
    update: IDbRecordBase[];
}