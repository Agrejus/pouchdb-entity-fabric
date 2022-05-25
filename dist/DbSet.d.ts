/// <reference path="../src/DataContext.d.ts" />
/// <reference path="../src/DbSet.d.ts" />
export declare type AttachedEntity<TEntity, TDocumentType extends string, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> = TEntityType & TEntity;
export interface IIndexableEntity {
    [key: string]: any;
}
export declare const PRISTINE_ENTITY_KEY = "__pristine_entity__";
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> implements IDbSet<TDocumentType, TEntity, TEntityType> {
    get IdKeys(): IdKeys<TEntity>;
    get DocumentType(): TDocumentType;
    private _idKeys;
    private _documentType;
    private _context;
    private _api;
    private _onBeforeAdd;
    /**
     * Constructor
     * @param documentType Type of Document this DbSet accepts
     * @param context Will be 'this' from the data context
     * @param idKeys Property(ies) that make up the primary key of the entity
     */
    constructor(documentType: TDocumentType, context: IDataContext, ...idKeys: IdKeys<TEntity>);
    /**
     * Attach an existing entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    attach(entity: AttachedEntity<TEntity, TDocumentType, TEntityType>): Promise<void>;
    /**
     * Add an entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    add(entity: TEntity): Promise<void>;
    private getKeyFromEntity;
    isMatch(first: TEntity, second: TEntity): boolean;
    onBeforeAdd(action: (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>) => void): void;
    /**
     * Add array of entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entities
     */
    addRange(entities: TEntity[]): Promise<void>;
    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    remove(entity: TEntity): Promise<void>;
    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    removeRange(entities: TEntity[]): Promise<void>;
    /**
     * Remove all entities from underlying Data Context, saveChanges must be called to persist these items to the store
     */
    removeAll(): Promise<void>;
    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param id
     */
    removeById(id: string): Promise<void>;
    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param ids
     */
    removeRangeById(ids: string[]): Promise<void>;
    private detachItems;
    private makeTrackable;
    private _all;
    all(): Promise<AttachedEntity<TEntity, TDocumentType, TEntityType>[]>;
    /**
     * Selects items from the data store, similar to Where in entity framework
     * @param selector
     * @returns Entity array
     */
    filter(selector: (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>, index?: number, array?: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) => boolean): Promise<AttachedEntity<TEntity, TDocumentType, TEntityType>[]>;
    /**
     * Matches items with the same document type
     * @param items
     * @returns Entity array
     */
    match(items: IDbRecordBase[]): AttachedEntity<TEntity, TDocumentType, TEntityType>[];
    /**
     * Selects a matching entity from the data store or returns null
     * @param selector
     * @returns Entity
     */
    find(selector: (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>, index?: number, array?: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) => boolean): Promise<AttachedEntity<TEntity, TDocumentType, TEntityType>>;
    /**
     * Detaches specified array of items from the context
     * @param entities
     */
    detach(entities: AttachedEntity<TEntity, TDocumentType, TEntityType>[]): AttachedEntity<TEntity, TDocumentType, TEntityType>[];
}
