import { DbSet } from "./DbSet";
import { DbSetEvent, DbSetEventCallback, DbSetIdOnlyEventCallback, DbSetPickDefaultActionOptional, DbSetPickDefaultActionRequired, DeepPartial, EntityIdKey, EntityIdKeys, IDataContext, IDbRecord, IDbSet, IDbSetBase, OmittedEntity } from "./typings";

interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    context: IDataContext;
    documentType: TDocumentType;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    exclusions?: (keyof TEntity)[];
    events?: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
}

export class DbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {

    private _context: IDataContext;
    private _documentType: TDocumentType;
    private _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    private _defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    private _exclusions: (keyof TEntity)[];
    private _events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
    private _onCreate: (dbset: IDbSetBase<string>) => void;

    constructor(onCreate: (dbset: IDbSetBase<string>) => void, params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions>) {

        const { context, documentType, idKeys, defaults, exclusions, events } = params;
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys ?? [];
        this._defaults = defaults ?? { add: {} as any, retrieve: {} as any };
        this._exclusions = exclusions ?? [];
        this._events = events ?? {
            "add": [],
            "remove": []
        };

        this._onCreate = onCreate;
    }

    private _buildParams<T extends (keyof TEntity) = never>() {
        return {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            events: this._events,
            exclusions: this._exclusions,
            idKeys: this._idKeys
        } as IDbSetBuilderParams<TDocumentType, TEntity, T>
    }

    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilder<TDocumentType, TEntity>) => IIdBuilder<TDocumentType, TEntity>) {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._idKeys.push(...idBuilder.Ids);
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._onCreate, this._buildParams());
    }

    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>

    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity>>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>
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
                retrieve: { ...this._defaults.add, ...value },
            };
        }

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._onCreate, this._buildParams());
    }

    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded 
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends (keyof OmittedEntity<TEntity>)>(...exclusions: T[]) {
        this._exclusions.push(...exclusions);
        return new DbSetBuilder<TDocumentType, TEntity, T | TExtraExclusions>(this._onCreate, this._buildParams<T>());
    }

    /**
     * Add an event listener to the DbSet
     * @param event 
     * @param callback 
     * @returns DbSetBuilder
     */
    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>;
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>) {
        this._events[event].push(callback);
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._onCreate, this._buildParams());
    }

    /**
     * Must call to fully create the DbSet.  Can use the extend callback to add functionality to the DbSet
     * @param extend Can be used to add functionality to the DbSet
     * @returns new DbSet
     */
    create<TExtension extends {}>(extend: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension = w => w as IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension) {

        const dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions> = new DbSet<TDocumentType, TEntity, TExtraExclusions>(this._documentType, this._context, this._defaults, ...this._idKeys);

        const result = extend(dbset);

        this._onCreate(result);

        return result;
    }
}

interface IIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

    /**
     * Used to build a key for the entity.  Key will be built in the order
     * the keys or selectors are added
     * @param key Key or property selector
     */
    add(key: EntityIdKey<TDocumentType, TEntity>): IIdBuilder<TDocumentType, TEntity>
}

class IdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IIdBuilder<TDocumentType, TEntity> {

    private _ids: EntityIdKeys<TDocumentType, TEntity> = [];

    get Ids() {
        return this._ids;
    }

    add(key: EntityIdKey<TDocumentType, TEntity>) {
        this._ids.push(key);
        return this;
    }
}