import { DbSetPickDefaultActionRequired, DbSetPickDefaultActionOptional, DeepPartial, EntitySelector } from "../../../types/common-types";
import { IDataContext } from "../../../types/context-types";
import { IDbSet, IDbSetProps, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, EntityIdKeys, OmittedEntity } from "../../../types/entity-types";
import { DbSetExtender, DbSetExtenderCreator, DbSetKeyType, IChainIdBuilder, IDbSetBuilderParams, IIdBuilderBase, ISplitDbSetOptions, ITerminateIdBuilder, PropertyMap } from '../../../types/dbset-builder-types';
export declare class DefaultDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string, TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {
    protected _context: IDataContext;
    protected _documentType: TDocumentType;
    protected _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected _keyType: DbSetKeyType;
    protected _defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    protected _exclusions: string[];
    protected _readonly: boolean;
    protected _extend: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[];
    protected _onCreate: (dbset: IDbSetBase<string>) => void;
    protected _map: PropertyMap<TDocumentType, TEntity, any>[];
    protected _index: string | null;
    protected _isSplitDbSet: ISplitDbSetOptions;
    protected _filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    protected _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult;
    constructor(onCreate: (dbset: IDbSetBase<string>) => void, params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions, TResult>);
    protected _buildParams<T extends string>(): IDbSetBuilderParams<TDocumentType, TEntity, T, any>;
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updated, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly(): DefaultDbSetBuilder<TDocumentType, Readonly<TEntity>, TExtraExclusions, IDbSet<TDocumentType, Readonly<TEntity>, TExtraExclusions>>;
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity>): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity>>): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends string>(...exclusions: T[]): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions | T, IDbSet<TDocumentType, TEntity, TExtraExclusions | T>>;
    map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name: string): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    extend<TExtension extends IDbSet<TDocumentType, TEntity, TExtraExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity>) => TResult, args: IDbSetProps<TDocumentType, TEntity>) => TExtension): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TExtension>;
    /**
     * Set a filter to be used on all queries
     * @param selector
     * @returns DbSetBuilder
     */
    filter(selector: EntitySelector<TDocumentType, TEntity>): DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>;
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create(): TResult;
}
