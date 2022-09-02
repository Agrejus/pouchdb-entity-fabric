import { DbSet } from "./DbSet";
import { DbSetAsyncEvent, DbSetEvent, DbSetEventCallback, DbSetEventCallbackAsync, DbSetIdOnlyEventCallback, DbSetIdOnlyEventCallbackAsync, DbSetPickDefaultActionOptional, DbSetPickDefaultActionRequired, DeepPartial, EntityIdKey, EntityIdKeys, IDataContext, IDbRecord, IDbSet, IDbSetBase, IDbSetProps, OmittedEntity } from "./typings";
interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {
    context: IDataContext;
    documentType: TDocumentType;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    exclusions?: (keyof TEntity)[];
    events?: {
        [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[];
    };
    asyncEvents?: {
        [key in DbSetAsyncEvent]: (DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync)[];
    };
    readonly: boolean;
    extend?: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[];
    keyType?: DbSetKeyType;
    map?: PropertyMap<TDocumentType, TEntity, any>[];
    index?: string;
}
declare type ConvertDateToString<T> = T extends Date ? string : T;
declare type DbSetExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult;
export declare type PropertyMap<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = {
    property: TProperty;
    map: (value: ConvertDateToString<TEntity[TProperty]>) => TEntity[TProperty];
};
export declare class DbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {
    private _context;
    private _documentType;
    private _idKeys;
    private _keyType;
    private _defaults;
    private _exclusions;
    private _events;
    private _asyncEvents;
    private _readonly;
    private _extend;
    private _onCreate;
    private _map;
    private _index;
    private _defaultExtend;
    constructor(onCreate: (dbset: IDbSetBase<string>) => void, params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions, TResult>);
    private _buildParams;
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly(): DbSetBuilder<TDocumentType, Readonly<TEntity>, TExtraExclusions, IDbSet<TDocumentType, Readonly<TEntity>, TExtraExclusions>>;
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity>>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends (keyof OmittedEntity<TEntity>)>(...exclusions: T[]): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions | T, IDbSet<TDocumentType, TEntity, TExtraExclusions | T>>;
    map<T extends (keyof OmittedEntity<TEntity>)>(propertyMap: PropertyMap<TDocumentType, TEntity, T>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name: string): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Add an event listener to the DbSet
     * @param event
     * @param callback
     * @returns DbSetBuilder
     */
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    on(event: "remove-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    on(event: "add-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    extend<TExtension extends IDbSet<TDocumentType, TEntity, TExtraExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity>) => TResult, args: IDbSetProps<TDocumentType, TEntity>) => TExtension): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TExtension>;
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create<TExtension extends {}>(): TResult;
    /**
     * Create a DbSet
     * @param extend Can be used to add functionality to the DbSet
     * @deprecated Use {@link extend} instead.
     */
    create<TExtension extends {}>(extend: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension): TResult;
}
interface ITerminateIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
}
interface IChainIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    /**
     * Used to build a key for the entity.  Key will be built in the order
     * the keys or selectors are added
     * @param key Key or property selector
     */
    add(key: EntityIdKey<TDocumentType, TEntity>): IChainIdBuilder<TDocumentType, TEntity>;
}
interface IIdBuilderBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends IChainIdBuilder<TDocumentType, TEntity> {
    /**
     * No keys, will only allow one single instance or record for the document type
     */
    none(): ITerminateIdBuilder<TDocumentType, TEntity>;
    /**
     * Key will be automatically generated
     */
    auto(): ITerminateIdBuilder<TDocumentType, TEntity>;
}
export declare type DbSetExtender<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> = new (props: IDbSetProps<TDocumentType, TEntity>) => DbSet<TDocumentType, TEntity, TExtraExclusions>;
export declare type DbSetKeyType = "auto" | "none" | "user-defined";
export {};
