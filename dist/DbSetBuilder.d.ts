import { DbSetEvent, DbSetEventCallback, DbSetIdOnlyEventCallback, DeepPartial, EntityIdKey, EntityIdKeys, IDataContext, IDbRecord, IDbSet, OmittedEntity } from "./typings";
interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    context: IDataContext;
    documentType: TDocumentType;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DeepPartial<OmittedEntity<TEntity>>;
    exclusions?: (keyof TEntity)[];
    events?: {
        [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[];
    };
}
export declare class DbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    private _context;
    private _documentType;
    private _idKeys;
    private _defaults;
    private _exclusions;
    private _events;
    constructor(params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions>);
    private _buildParams;
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilder<TDocumentType, TEntity>) => IIdBuilder<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>;
    /**
     * Set default values on add or retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param defaultEntity Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(defaultEntity: DeepPartial<OmittedEntity<TEntity>>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>;
    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends (keyof OmittedEntity<TEntity>)>(...exclusions: T[]): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions | T>;
    /**
     * Add an event listener to the DbSet
     * @param event
     * @param callback
     * @returns DbSetBuilder
     */
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    /**
     * Must call to fully create the DbSet.  Can use the extend callback to add functionality to the DbSet
     * @param extend Can be used to add functionality to the DbSet
     * @returns new DbSet
     */
    create<TExtension extends {}>(extend?: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension): IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension;
}
interface IIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    /**
     * Used to build a key for the entity.  Key will be built in the order
     * the keys or selectors are added
     * @param key Key or property selector
     */
    add(key: EntityIdKey<TDocumentType, TEntity>): IIdBuilder<TDocumentType, TEntity>;
}
export {};
