import { DbSetEvent, DbSetEventCallback, DbSetIdOnlyEventCallback, EntityIdKeys, EntitySelector, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, DocumentKeySelector, IIndexableEntity, OmittedEntity, DeepPartial, DbSetPickDefaultActionRequired, IDbSetInfo, IDbSetProps, DbSetAsyncEvent, DbSetEventCallbackAsync, DbSetIdOnlyEventCallbackAsync } from './typings';
import { validateAttachedEntity } from './Validation';
import { v4 as uuidv4 } from 'uuid';
import { DbSetKeyType, PropertyMap } from './DbSetBuilder';

export const PRISTINE_ENTITY_KEY = "__pristine_entity__";

interface IPrivateContext<TDocumentType extends string> extends IDataContext {
    _getApi: () => IDbSetApi<TDocumentType>;
}

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {

    /**
     * Get the IdKeys for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get IdKeys() { return this._idKeys }

    /**
     * Get the Document Type for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get DocumentType() { return this._documentType }

    private _defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    private _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    private _documentType: TDocumentType;
    private _context: IPrivateContext<TDocumentType>;
    private _api: IDbSetApi<TDocumentType>;
    private _isReadonly: boolean;
    private _keyType: DbSetKeyType;
    private _map: PropertyMap<TDocumentType, TEntity, any>[];
    private _events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] } = {
        "add": [],
        "remove": []
    }

    private _asyncEvents: { [key in DbSetAsyncEvent]: (DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync)[] } = {
        "add-invoked": [],
        "remove-invoked": []
    }

    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        this._documentType = props.documentType;
        this._context = props.context as IPrivateContext<TDocumentType>;
        this._idKeys = props.idKeys;
        this._defaults = props.defaults;
        this._isReadonly = props.readonly;
        this._keyType = props.keyType;
        this._events = props.events;
        this._asyncEvents = props.asyncEvents;
        this._map = props.map;

        this._api = this._context._getApi();

        const properties = Object.getOwnPropertyNames(DbSet.prototype).filter(w => w !== "IdKeys" && w !== "DocumentType");

        // Allow spread operator to work on the class for extending it - Deprecated
        for (let property of properties) {
            (this as any)[property] = (this as any)[property]
        }
    }

    info() {
        const info: IDbSetInfo<TDocumentType, TEntity> = {
            DocumentType: this._documentType,
            IdKeys: this._idKeys,
            Defaults: this._defaults,
            KeyType: this._keyType,
            Readonly: this._isReadonly,
            Map: this._map
        }

        return info;
    }

    private _processAddition(entity: OmittedEntity<TEntity, TExtraExclusions>) {
        const addItem: IDbRecord<TDocumentType> = entity as any;
        (addItem as any).DocumentType = this._documentType;
        const id = this._getKeyFromEntity(entity as any);

        if (id != undefined) {
            (addItem as any)._id = id;
        }

        if (this._events["add"].length > 0) {
            this._events["add"].forEach(w => w(entity as any));
        }

        return this._api.makeTrackable(addItem, this._defaults.add, this._isReadonly, this._map) as TEntity;
    }

    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return entities.map(entity => ({ ...this._processAddition(entity) }));
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        const data = this._api.getTrackedData();
        const { add } = data;

        const result = entities.map(entity => {
            const indexableEntity: IIndexableEntity = entity as any;

            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            const trackableEntity = this._processAddition(entity);

            add.push(trackableEntity);

            return trackableEntity;
        });

        if (this._asyncEvents['add-invoked'].length > 0) {
            await Promise.all(this._asyncEvents['add-invoked'].map(w => w(result as any)))
        }

        return result
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]) {
        // build the id's
        const all = await this._api.getAllData(this._documentType);
        const allDictionary: { [key: string]: TEntity } = all.reduce((a, v) => ({ ...a, [v._id]: v }), {})
        const result: TEntity[] = [];

        for(let entity of entities as any[]) {
            const instance = entity._id != null ? entity as TEntity : { ...this._processAddition(entity) } as TEntity;
            const found = allDictionary[instance._id]

            if (found) {
                // update
                const merged = this._merge(found, entity);
                const mergedAndTrackable = this._api.makeTrackable(merged, this._defaults.add, this._isReadonly, this._map) as TEntity;
                this._api.send([mergedAndTrackable]);
                result.push(mergedAndTrackable)
                continue;
            }

            const [added] = await this.add(entity);

            result.push(added)
        }

        return result;
    }

    private _getKeyFromEntity(entity: TEntity) {

        if (this._keyType === 'auto') {
            return uuidv4();
        }

        if (this._keyType === 'none') {
            return this._documentType;
        }

        // user defined key
        const indexableEntity = entity as IIndexableEntity

        const keyData = this._idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }

            const selector: DocumentKeySelector<TEntity> = w as any;

            return String(selector(entity));
        });

        return [this._documentType, ...keyData].join("/");
    }

    isMatch(first: TEntity, second: TEntity) {
        return this._getKeyFromEntity(first) === this._getKeyFromEntity(second);
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {

        if (this._asyncEvents['remove-invoked'].length > 0) {
            await Promise.all(this._asyncEvents['remove-invoked'].map(w => w(entities as any)))
        }

        if (entities.some(w => typeof w === "string")) {
            await Promise.all(entities.map(w => this._removeById(w)))
            return;
        }

        await Promise.all(entities.map(w => this._remove(w)))
    }

    private async _remove(entity: TEntity) {
        const data = this._api.getTrackedData();
        const { remove } = data;

        const ids = remove.map(w => w._id);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity._id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`)
        }

        this._events["remove"].forEach(w => w(entity as any));

        remove.push(entity as any);
    }

    async empty() {
        const items = await this.all();
        await this.remove(...items);
    }

    private async _removeById(id: string) {
        const data = this._api.getTrackedData();
        const { removeById } = data;

        if (removeById.includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`)
        }

        this._events["remove"].forEach(w => w(id as any));

        removeById.push(id);
    }

    private _detachItems(data: TEntity[]) {
        return this._api.detach(data);
    }

    private async _all() {
        const data = await this._api.getAllData(this._documentType);
        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        return data.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map) as TEntity);
    }

    async all() {
        const result = await this._all();

        this._api.send(result);

        return result;
    }

    async filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean) {
        const data = await this._all();

        const result = [...data].filter(selector);

        this._api.send(result)

        return result;
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this._documentType) as TEntity[]
    }

    async get(...ids: string[]) {
        const entities = await this._api.getStrict(...ids);
        const result = entities.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map) as TEntity);

        if (result.length > 0) {
            this._api.send(result)
        }

        return result;
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {

        const data = await this._all();
        const result = [...data].find(selector);

        if (result) {
            this._api.send([result])
        }

        return result;
    }

    detach(...entities: TEntity[]) {
        this.unlink(...entities);
    }

    unlink(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        this._detachItems(entities)
    }

    private _merge(existingEntity: TEntity, newEntity: TEntity) {
        return { ...existingEntity, ...newEntity, [PRISTINE_ENTITY_KEY]: { ...existingEntity, ...((newEntity as IIndexableEntity)[PRISTINE_ENTITY_KEY] ?? {}) }, _rev: existingEntity._rev }
    }

    async link(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        // Find the existing _rev just in case it's not in sync, will throw if an id is not found
        const found = await this._api.getStrict(...entities.map(w => w._id));
        const foundDictionary: { [key: string]: TEntity } = found.reduce((a, v) => ({ ...a, [v._id]: v }), {});

        const result = entities.map(w => this._api.makeTrackable(this._merge(foundDictionary[w._id], w), this._defaults.add, this._isReadonly, this._map));

        this._api.send(result);

        return result;
    }

    async attach(...entities: TEntity[]) {
        await this.link(...entities);
    }

    async first() {
        const data = await this._all();
        const result = data[0];

        if (result) {
            this._api.send([result])
        }

        return result as TEntity | undefined;
    }

    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    on(event: "remove-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync): void;
    on(event: "add-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity>): void;
    on(event: DbSetEvent | DbSetAsyncEvent, callback: any) {

        if (event === 'add-invoked' || event === "remove-invoked") {
            this._asyncEvents[event].push(callback)
            return;
        }

        this._events[event].push(callback);
    }
}