import { DbSetEventCallback, DbSetIdOnlyEventCallback, EntityIdKeys, EntitySelector, IDbRecord, IDbRecordBase, IDbSet, OmittedEntity, IDbSetInfo, IDbSetProps, DbSetEventCallbackAsync, DbSetIdOnlyEventCallbackAsync, IDbSetEnumerable } from './typings';
export declare const PRISTINE_ENTITY_KEY = "__pristine_entity__";
export declare const DIRTY_ENTITY_MARKER = "__isDirty";
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {
    /**
     * Get the IdKeys for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get IdKeys(): EntityIdKeys<TDocumentType, TEntity>;
    /**
     * Get the Document Type for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get DocumentType(): TDocumentType;
    private _indexStore;
    private _defaults;
    private _idKeys;
    private _documentType;
    private _context;
    private _api;
    private _isReadonly;
    private _keyType;
    private _serializers;
    private _deserializers;
    private _events;
    private _asyncEvents;
    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity>);
    info(): IDbSetInfo<TDocumentType, TEntity>;
    private _processAddition;
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    private _merge;
    private _getAllData;
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
    private _getKeyFromEntity;
    isMatch(first: TEntity, second: any): boolean;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    private _remove;
    useIndex(name: string): IDbSetEnumerable<TDocumentType, TEntity, TExtraExclusions>;
    empty(): Promise<void>;
    private _removeById;
    private _detachItems;
    private _all;
    all(): Promise<TEntity[]>;
    filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>;
    match(...items: IDbRecordBase[]): TEntity[];
    get(...ids: string[]): Promise<TEntity[]>;
    find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>;
    detach(...entities: TEntity[]): void;
    unlink(...entities: TEntity[]): void;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    link(...entities: TEntity[]): Promise<TEntity[]>;
    attach(...entities: TEntity[]): Promise<void>;
    first(): Promise<TEntity>;
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    on(event: "remove-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync): void;
    on(event: "add-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity>): void;
}
