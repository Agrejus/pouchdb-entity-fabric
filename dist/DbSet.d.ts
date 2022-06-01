import { DbSetEventCallback, DbSetIdOnlyEventCallback, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IdKeys, OmittedEntity } from './typings';
export declare const PRISTINE_ENTITY_KEY = "__pristine_entity__";
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>, TAddExclusions extends keyof TEntity = undefined> implements IDbSet<TDocumentType, TEntity, TAddExclusions> {
    get IdKeys(): IdKeys<TEntity>;
    get DocumentType(): TDocumentType;
    private _idKeys;
    private _documentType;
    private _context;
    private _api;
    private _events;
    /**
     * Constructor
     * @param documentType Type of Document this DbSet accepts
     * @param context Will be 'this' from the data context
     * @param idKeys Property(ies) that make up the primary key of the entity
     */
    constructor(documentType: TDocumentType, context: IDataContext, ...idKeys: IdKeys<TEntity>);
    /**
     * Add an entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    add(entity: OmittedEntity<TEntity, TAddExclusions>): Promise<TEntity>;
    private getKeyFromEntity;
    isMatch(first: TEntity, second: TEntity): boolean;
    /**
     * Add array of entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entities
     */
    addRange(entities: OmittedEntity<TEntity, TAddExclusions>[]): Promise<Awaited<TEntity>[]>;
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
    private _all;
    all(): Promise<TEntity[]>;
    /**
     * Selects items from the data store, similar to Where in entity framework
     * @param selector
     * @returns Entity array
     */
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    /**
     * Matches items with the same document type
     * @param items
     * @returns Entity array
     */
    match(items: IDbRecordBase[]): TEntity[];
    /**
     * Selects a matching entity from the data store or returns null
     * @param selector
     * @returns Entity
     */
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity>;
    /**
     * Detaches specified array of items from the context
     * @param entities
     */
    detach(...entities: TEntity[]): TEntity[];
    /**
     * Attach an existing entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites
     */
    attach(...entites: TEntity[]): void;
    first(): Promise<TEntity>;
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
}
