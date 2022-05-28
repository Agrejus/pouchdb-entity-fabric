import { AttachedEntity, DbSetEvent, DbSetEventCallback, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, IdKeys, IIndexableEntity } from './typings';

export const PRISTINE_ENTITY_KEY = "__pristine_entity__";

interface IPrivateContext<TDocumentType extends string> extends IDataContext {
    _getApi: () => IDbSetApi<TDocumentType>;
}

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> implements IDbSet<TDocumentType, TEntity, TEntityType> {

    get IdKeys() { return this._idKeys }
    get DocumentType() { return this._documentType }

    private _idKeys: IdKeys<TEntity>;
    private _documentType: TDocumentType;
    private _context: IPrivateContext<TDocumentType>;
    private _api: IDbSetApi<TDocumentType>;
    private _events: { [key in DbSetEvent]: DbSetEventCallback<TEntity, TDocumentType, TEntityType>[] } = { 
        "add": [],
        "remove": []
     }

    /**
     * Constructor
     * @param documentType Type of Document this DbSet accepts
     * @param context Will be 'this' from the data context
     * @param idKeys Property(ies) that make up the primary key of the entity
     */
    constructor(documentType: TDocumentType, context: IDataContext, ...idKeys: IdKeys<TEntity>) {
        this._documentType = documentType;
        this._context = context as IPrivateContext<TDocumentType>;
        this._idKeys = idKeys;
        this._api = this._context._getApi();
    }

    /**
     * Add an entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity 
     */
    async add(entity: TEntity) {

        const indexableEntity: IIndexableEntity = entity as any;

        if (indexableEntity["_rev"] !== undefined) {
            throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
        }

        const data = this._api.getTrackedData();
        const { add } = data;

        const addItem: IDbRecord<TDocumentType> = entity as any;
        addItem.DocumentType = this._documentType;
        const id = this.getKeyFromEntity(entity);

        if (id != undefined) {
            const ids = add.map(w => w._id);

            if (ids.includes(id)) {
                throw new Error(`Cannot add entity with same id more than once.  _id: ${id}`)
            }

            (addItem as any)._id = id;
        }

        this._events["add"].forEach(w => w(entity as any));

        add.push(addItem);
    }

    private getKeyFromEntity(entity: TEntity) {

        if (this._idKeys.length === 0) {
            return null;
        }

        const keyData = Object.keys(entity).filter((w: any) => this._idKeys.includes(w)).map(w => {

            const value = (entity as any)[w];

            if (value instanceof Date) {
                return value.toISOString();
            }

            return value
        })
        return [this.DocumentType, ...keyData].join("/");
    }

    isMatch(first: TEntity, second: TEntity) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }

    /**
     * Add array of entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entities 
     */
    async addRange(entities: TEntity[]) {
        await Promise.all(entities.map(w => this.add(w)));
    }

    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity 
     */
    async remove(entity: TEntity) {
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

    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity 
     */
    async removeRange(entities: TEntity[]) {
        await Promise.all(entities.map(w => this.remove(w)))
    }

    /**
     * Remove all entities from underlying Data Context, saveChanges must be called to persist these items to the store
     */
    async removeAll() {
        const items = await this.all();
        await this.removeRange(items);
    }

    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param id 
     */
    async removeById(id: string) {
        const data = this._api.getTrackedData();
        const { removeById } = data;

        if (removeById.includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`)
        }

        removeById.push(id);
    }

    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param ids 
     */
    async removeRangeById(ids: string[]) {
        await Promise.all(ids.map(w => this.removeById(w)))
    }

    private detachItems(data: AttachedEntity<TEntity, TDocumentType, TEntityType>[], matcher: (first: AttachedEntity<TEntity, TDocumentType, TEntityType>, second: AttachedEntity<TEntity, TDocumentType, TEntityType>) => boolean) {
        return this._api.detach(data, matcher);
    }

    private makeTrackable<T extends Object>(entity: T): T {
        const proxyHandler: ProxyHandler<T> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);
                const oldValue = indexableEntity[key];

                if (indexableEntity[PRISTINE_ENTITY_KEY] === undefined) {
                    indexableEntity[PRISTINE_ENTITY_KEY] = {};
                }

                if (indexableEntity[PRISTINE_ENTITY_KEY][key] === undefined) {
                    indexableEntity[PRISTINE_ENTITY_KEY][key] = oldValue;
                }

                indexableEntity[key] = value;

                return true;
            }
        }

        return new Proxy(entity, proxyHandler) as any
    }

    private async _all() {
        const data = await this._api.getAllData(this._documentType)
        return data.map(w => this.makeTrackable(w) as AttachedEntity<TEntity, TDocumentType, TEntityType>);
    }

    async all() {
        const result = await this._all();

        this._api.send(result)

        return result;
    }

    /**
     * Selects items from the data store, similar to Where in entity framework
     * @param selector 
     * @returns Entity array
     */
    async filter(selector: (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>, index?: number, array?: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) => boolean) {
        const data = await this._all();

        const result = [...data].filter(selector);

        this._api.send(result)

        return result;
    }

    /**
     * Matches items with the same document type
     * @param items 
     * @returns Entity array
     */
    match(items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.DocumentType) as AttachedEntity<TEntity, TDocumentType, TEntityType>[]
    }

    /**
     * Selects a matching entity from the data store or returns null
     * @param selector 
     * @returns Entity
     */
    async find(selector: (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>, index?: number, array?: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) => boolean) {
        const data = await this._all();
        const result = [...data].find(selector);

        if (result) {
            this._api.send([result])
        }

        return result;
    }

    /**
     * Detaches specified array of items from the context
     * @param entities 
     */
    detach(...entities: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) {
        return this.detachItems(entities, this.isMatch.bind(this)) as AttachedEntity<TEntity, TDocumentType, TEntityType>[]
    }

    /**
     * Attach an existing entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites 
     */
     attach(...entites: AttachedEntity<TEntity, TDocumentType, TEntityType>[]) {
        const data = this._api.getTrackedData();
        const { attach } = data;

        data.attach = [...attach, ...entites];
    }

    on(event: DbSetEvent, callback: DbSetEventCallback<TEntity, TDocumentType, TEntityType>) {
        this._events[event].push(callback);
    }
}