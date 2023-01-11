import { DbSet } from "./DbSet";
import { DbSetAsyncEvent, DbSetEvent, DbSetEventCallback, DbSetEventCallbackAsync, DbSetIdOnlyEventCallback, DbSetIdOnlyEventCallbackAsync, DbSetPickDefaultActionOptional, DbSetPickDefaultActionRequired, DeepPartial, EntityIdKey, EntityIdKeys, IDataContext, IDbRecord, IDbSet, IDbSetBase, IDbSetProps, OmittedEntity } from "./typings";

interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {
    context: IDataContext;
    documentType: TDocumentType;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    exclusions?: (keyof TEntity)[];
    events?: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
    asyncEvents?: { [key in DbSetAsyncEvent]: (DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync)[] };
    readonly: boolean;
    extend?: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[]
    keyType?: DbSetKeyType;
    serializers?: PropertySerializer<TDocumentType, TEntity, any>[];
    deserializers?: PropertyDeserializer<TDocumentType, TEntity, any>[];
    index?: string;
}

type ConvertDateToString<T> = T extends Date ? string : T;
type DbSetExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult

export type PropertyDeserializer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = { property: TProperty, map: PropertyDeserializationMapper<TDocumentType, TEntity, TProperty> }
export type PropertySerializer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = { property: TProperty, map: PropertySerializationMapper<TDocumentType, TEntity, TProperty> }
export type PropertyMappper<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = { serialize: PropertySerializationMapper<TDocumentType, TEntity, TProperty>, deserialize: PropertyDeserializationMapper<TDocumentType, TEntity, TProperty> }
export type PropertyDeserializationMapper<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = (value: ConvertDateToString<TEntity[TProperty]>, entity: TEntity) => TEntity[TProperty];
export type PropertySerializationMapper<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = (value: ConvertDateToString<TEntity[TProperty]>, entity: TEntity) => any;
export type PickPropertyMap<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = { property: TProperty, map: PropertyDeserializationMapper<TDocumentType, TEntity, TProperty> | PropertySerializationMapper<TDocumentType, TEntity, TProperty> | PropertyMappper<TDocumentType, TEntity, TProperty> }
export type PropertyMap<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends (keyof OmittedEntity<TEntity>)> = { property: TProperty, map: PropertyMappper<TDocumentType, TEntity, TProperty> }

export class DbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity), TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {

    private _context: IDataContext;
    private _documentType: TDocumentType;
    private _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    private _keyType: DbSetKeyType;
    private _defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    private _exclusions: (keyof TEntity)[];
    private _events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
    private _asyncEvents: { [key in DbSetAsyncEvent]: (DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync)[] };
    private _readonly: boolean = false;
    private _extend: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[];
    private _onCreate: (dbset: IDbSetBase<string>) => void;
    private _serializers: PropertySerializer<TDocumentType, TEntity, any>[] = [];
    private _deserializers: PropertyDeserializer<TDocumentType, TEntity, any>[] = [];
    private _index: string | null;

    private _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult = (Instance, a) => new Instance(a) as any;

    constructor(onCreate: (dbset: IDbSetBase<string>) => void, params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions, TResult>) {
        const { context, documentType, idKeys, defaults, exclusions, events, readonly, extend, keyType, asyncEvents, serializers, deserializers, index } = params;
        this._extend = extend ?? [];
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys ?? [];
        this._defaults = defaults ?? { add: {} as any, retrieve: {} as any };
        this._exclusions = exclusions ?? [];
        this._readonly = readonly;
        this._keyType = keyType ?? "auto";
        this._events = events ?? {
            "add": [],
            "remove": []
        };
        this._asyncEvents = asyncEvents ?? {
            "add-invoked": [],
            "remove-invoked": []
        }
        this._serializers = serializers ?? [];
        this._deserializers = deserializers ?? [];
        this._index = index;

        this._onCreate = onCreate;
    }

    private _buildParams<T extends (keyof TEntity)>() {
        return {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            events: this._events,
            exclusions: this._exclusions,
            idKeys: this._idKeys,
            readonly: this._readonly,
            extend: this._extend,
            keyType: this._keyType,
            asyncEvents: this._asyncEvents,
            serializers: this._serializers,
            deserializers: this._deserializers,
            index: this._index
        } as IDbSetBuilderParams<TDocumentType, TEntity, T, any>
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        return new DbSetBuilder<TDocumentType, Readonly<TEntity>, TExtraExclusions, IDbSet<TDocumentType, Readonly<TEntity>, TExtraExclusions>>(this._onCreate, this._buildParams<TExtraExclusions>());
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
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>

    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity>>): DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>
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

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
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
        return new DbSetBuilder<TDocumentType, TEntity, T | TExtraExclusions, IDbSet<TDocumentType, TEntity, T | TExtraExclusions>>(this._onCreate, this._buildParams<T | TExtraExclusions>());
    }

    map<T extends (keyof OmittedEntity<TEntity>)>(map: PickPropertyMap<TDocumentType, TEntity, T>) {

        const keys = Object.keys(map.map);

        if (keys.length === 0) {
            this._deserializers.push({ property: map.property, map: map.map as PropertyDeserializationMapper<TDocumentType, TEntity, T> });
        } else {
            const instance = map.map as PropertyMappper<TDocumentType, TEntity, T>;
            
            if (instance.deserialize != null) {
                this._deserializers.push({ property: map.property, map: instance.deserialize });
            }
            
            if (instance.serialize != null) {
                this._serializers.push({ property: map.property, map: instance.serialize });
            }
        }

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name: string) {

        this._index = name;

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

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
    on(event: DbSetEvent | DbSetAsyncEvent, callback: any) {

        if (event === 'add-invoked' || event === "remove-invoked") {
            this._asyncEvents[event].push(callback)
        } else {
            this._events[event].push(callback);
        }

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult>(this._onCreate, this._buildParams());
    }

    extend<TExtension extends IDbSet<TDocumentType, TEntity, TExtraExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity>) => TResult, args: IDbSetProps<TDocumentType, TEntity>) => TExtension) {

        this._extend.push(extend as any);

        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TExtension>(this._onCreate, this._buildParams<TExtraExclusions>());
    }

    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create<TExtension extends {}>(): TResult

    /**
     * Create a DbSet
     * @param extend Can be used to add functionality to the DbSet
     * @deprecated Use {@link extend} instead.
     */
    create<TExtension extends {}>(extend: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension): TResult
    create<TExtension extends {}>(extend?: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension): TResult {

        let result: TResult;

        if (extend) {
            const dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions> = new DbSet<TDocumentType, TEntity, TExtraExclusions>({
                context: this._context,
                defaults: this._defaults,
                documentType: this._documentType,
                idKeys: this._idKeys,
                readonly: this._readonly,
                keyType: this._keyType,
                asyncEvents: this._asyncEvents,
                events: this._events,
                deserializers: this._deserializers,
                serializers: this._serializers,
                index: this._index
            });
            result = extend(dbset) as any
        } else {

            if (this._extend.length === 0) {
                this._extend.push(this._defaultExtend)
            }

            result = this._extend.reduce((a: any, v, i) => v(i === 0 ? a : a.constructor, {
                context: this._context,
                defaults: this._defaults,
                documentType: this._documentType,
                idKeys: this._idKeys,
                readonly: this._readonly,
                keyType: this._keyType,
                asyncEvents: this._asyncEvents,
                events: this._events,
                deserializers: this._deserializers,
                serializers: this._serializers,
                index: this._index
            }), DbSet);
        }

        this._onCreate(result);

        return result;
    }
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

export type DbSetExtender<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> = new (props: IDbSetProps<TDocumentType, TEntity>) => DbSet<TDocumentType, TEntity, TExtraExclusions>;

export type DbSetKeyType = "auto" | "none" | "user-defined";

class IdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IIdBuilderBase<TDocumentType, TEntity> {

    private _ids: EntityIdKeys<TDocumentType, TEntity> = [];
    private _keyType: DbSetKeyType = "auto"

    get Ids() {
        return this._ids;
    }

    get KeyType() {
        return this._keyType;
    }

    add(key: EntityIdKey<TDocumentType, TEntity>) {
        this._keyType = "user-defined";
        this._ids.push(key);
        return this;
    }

    none() {
        this._keyType = "none";
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }

    auto() {
        this._keyType = "auto";
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }
}