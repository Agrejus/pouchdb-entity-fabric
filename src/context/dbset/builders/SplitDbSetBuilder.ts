import { IDbSet, IDbSetBase, IDbSetProps, ISplitDbSet } from "../../../types/dbset-types";
import { EntityIdKeys, IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { SplitDbSet } from '../SplitDbSet';
import { DbSetPickDefaultActionRequired, DbSetPickDefaultActionOptional, DeepPartial, EntitySelector } from "../../../types/common-types";
import { IDataContext } from "../../../types/context-types";
import { DbSetKeyType, DbSetExtenderCreator, PropertyMap, ISplitDbSetOptions, DbSetExtender, IDbSetBuilderParams, IIdBuilderBase, IChainIdBuilder, ITerminateIdBuilder, IdBuilder } from "../../../types/dbset-builder-types";

export class SplitDbSetBuilder<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExtraExclusions extends string,
    TResult extends ISplitDbSet<TDocumentType, TEntity, TExtraExclusions>
>  {
    protected _context: IDataContext;
    protected _documentType: TDocumentType;
    protected _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected _keyType: DbSetKeyType;
    protected _defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    protected _exclusions: string[];
    protected _readonly: boolean = false;
    protected _extend: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[];
    protected _onCreate: (dbset: IDbSetBase<string>) => void;
    protected _map: PropertyMap<TDocumentType, TEntity, any>[] = [];
    protected _index: string | undefined;
    protected _isSplitDbSet: ISplitDbSetOptions;
    protected _filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    
    protected _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult = (Instance, a) => new Instance(a) as any;

    constructor(onCreate: (dbset: IDbSetBase<string>) => void, params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions, TResult>) {
        const { context, documentType, idKeys, defaults, exclusions, readonly, extend, keyType, map, index, isSplitDbSet, filterSelector } = params;
        this._extend = extend ?? [];
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys ?? [];
        this._defaults = defaults ?? { add: {} as any, retrieve: {} as any };
        this._exclusions = exclusions ?? [];
        this._readonly = readonly;
        this._keyType = keyType ?? "auto";
        this._map = map ?? [];
        this._index = index;
        this._isSplitDbSet = isSplitDbSet;
        this._filterSelector = filterSelector ?? null

        this._onCreate = onCreate;
    }

    protected _buildParams<T extends string>() {

        const params: IDbSetBuilderParams<TDocumentType, TEntity, T, any> = {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            exclusions: this._exclusions,
            idKeys: this._idKeys,
            readonly: this._readonly,
            extend: this._extend as any,
            keyType: this._keyType,
            map: this._map,
            index: this._index,
            isSplitDbSet: this._isSplitDbSet
        }
        return params
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        return new SplitDbSetBuilder<TDocumentType, Readonly<TEntity>, TExtraExclusions, ISplitDbSet<TDocumentType, Readonly<TEntity>, TExtraExclusions>>(this._onCreate, this._buildParams<TExtraExclusions>());
    }
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)) {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._idKeys.push(...idBuilder.Ids);
        this._keyType = idBuilder.KeyType;
        return new SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity>): SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>

    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity>>): SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity> | DeepPartial<OmittedEntity<TEntity>>) {

        if ("add" in value) {
            this._defaults = {
                ...this._defaults,
                add: { ...this._defaults.add, ...value.add }
            };
        }

        if ("retrieve" in value) {
            this._defaults = {
                ...this._defaults,
                retrieve: { ...this._defaults.retrieve, ...value.retrieve }
            };
        }

        if (!("retrieve" in value) && !("add" in value)) {
            this._defaults = {
                ...this._defaults,
                add: { ...this._defaults.add, ...value },
                retrieve: { ...this._defaults.retrieve, ...value },
            };
        }

        return new SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded 
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends string>(...exclusions: T[]) {
        this._exclusions.push(...exclusions);
        return new SplitDbSetBuilder<TDocumentType, TEntity, T | TExtraExclusions, ISplitDbSet<TDocumentType, TEntity, T | TExtraExclusions>>(this._onCreate, this._buildParams<T | TExtraExclusions>());
    }

    map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>) {
        this._map.push(propertyMap);
        return new SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name: string) {

        this._index = name;

        return new SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    extend<TExtension extends ISplitDbSet<TDocumentType, TEntity, TExtraExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity>) => TResult, args: IDbSetProps<TDocumentType, TEntity>) => TExtension) {

        this._extend.push(extend as any);

        return new SplitDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TExtension>(this._onCreate, this._buildParams<TExtraExclusions>());
    }

    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create(): TResult {

        if (this._extend.length === 0) {
            this._extend.push(this._defaultExtend)
        }

        const result = this._extend.reduce((a: any, v, i) => v(i === 0 ? a : a.constructor, {
            context: this._context,
            defaults: this._defaults,
            documentType: this._documentType,
            idKeys: this._idKeys,
            readonly: this._readonly,
            keyType: this._keyType,
            map: this._map,
            index: this._index,
            splitDbSetOptions: this._isSplitDbSet,
            filterSelector: this._filterSelector
        }), SplitDbSet);

        this._onCreate(result);

        return result;
    }
}