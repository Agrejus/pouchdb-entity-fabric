import { DbSetEventCallback, DbSetIdOnlyEventCallback, EntityIdKeys, EntitySelector, IDataContext, IDbRecord, IDbRecordBase, IDbSet, OmittedEntity } from './typings';
export declare const PRISTINE_ENTITY_KEY = "__pristine_entity__";
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {
    get IdKeys(): EntityIdKeys<TDocumentType, TEntity>;
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
    constructor(documentType: TDocumentType, context: IDataContext, ...idKeys: EntityIdKeys<TDocumentType, TEntity>);
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    private _getKeyFromEntity;
    isMatch(first: TEntity, second: TEntity): boolean;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    private _remove;
    empty(): Promise<void>;
    private _removeById;
    private _detachItems;
    private _all;
    all(): Promise<TEntity[]>;
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    match(...items: IDbRecordBase[]): TEntity[];
    get(...ids: string[]): Promise<TEntity[]>;
    find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>;
    detach(...entities: TEntity[]): void;
    unlink(...entities: TEntity[]): void;
    link(...entities: TEntity[]): Promise<void>;
    attach(...entities: TEntity[]): Promise<void>;
    first(): Promise<TEntity>;
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
}
