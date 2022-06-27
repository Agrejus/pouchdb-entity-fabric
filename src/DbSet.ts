import { DbSetEvent, DbSetEventCallback, DbSetIdOnlyEventCallback, EntityIdKeys, EntitySelector, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, DocumentKeySelector, IIndexableEntity, OmittedEntity, DeepPartial } from './typings';
import { validateAttachedEntity } from './Validation';
import { v4 as uuidv4 } from 'uuid';

export const PRISTINE_ENTITY_KEY = "__pristine_entity__";

interface IPrivateContext<TDocumentType extends string> extends IDataContext {
    _getApi: () => IDbSetApi<TDocumentType>;
}

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {

    get IdKeys() { return this._idKeys }
    get DocumentType() { return this._documentType }

    private _defaults: DeepPartial<OmittedEntity<TEntity>>;
    private _idKeys: EntityIdKeys<TDocumentType, TEntity>;
    private _documentType: TDocumentType;
    private _context: IPrivateContext<TDocumentType>;
    private _api: IDbSetApi<TDocumentType>;
    private _events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] } = {
        "add": [],
        "remove": []
    }

    /**
     * Constructor
     * @param documentType Type of Document this DbSet accepts
     * @param context Will be 'this' from the data context
     * @param idKeys Property(ies) that make up the primary key of the entity
     */
    constructor(documentType: TDocumentType, context: IDataContext, defaults: DeepPartial<OmittedEntity<TEntity>>, ...idKeys: EntityIdKeys<TDocumentType, TEntity>) {
        this._documentType = documentType;
        this._context = context as IPrivateContext<TDocumentType>;
        this._idKeys = idKeys;
        this._defaults = defaults;

        this._api = this._context._getApi();
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        const data = this._api.getTrackedData();
        const { add } = data;

        return entities.map(entity => {
            const indexableEntity: IIndexableEntity = entity as any;

            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            const addItem: IDbRecord<TDocumentType> = entity as any;
            (addItem as any).DocumentType = this._documentType;
            const id = this._getKeyFromEntity(entity as any);

            if (id != undefined) {
                const ids = add.map(w => w._id);

                if (ids.includes(id)) {
                    throw new Error(`Cannot add entity with same id more than once.  _id: ${id}`)
                }

                (addItem as any)._id = id;
            }

            this._events["add"].forEach(w => w(entity as any));

            const trackableEntity = this._api.makeTrackable(addItem, this._defaults) as TEntity;

            add.push(trackableEntity);

            return trackableEntity;
        })
    }

    private _getKeyFromEntity(entity: TEntity) {

        if (this._idKeys.length === 0) {
            return uuidv4();
        }
        const indexableEntity = entity as IIndexableEntity

        const keyData = this._idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }

            const selector: DocumentKeySelector<TEntity> = w as any;

            return String(selector(entity));
        });

        return [this.DocumentType, ...keyData].join("/");
    }

    isMatch(first: TEntity, second: TEntity) {
        return this._getKeyFromEntity(first) === this._getKeyFromEntity(second);
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {

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
        const data = await this._api.getAllData(this._documentType)
        return data.map(w => this._api.makeTrackable(w, this._defaults) as TEntity);
    }

    async all() {
        const result = await this._all();

        this._api.send(result, false);

        return result;
    }

    async filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean) {
        const data = await this._all();

        const result = [...data].filter(selector);

        this._api.send(result, false)

        return result;
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.DocumentType) as TEntity[]
    }

    async get(...ids: string[]) {
        const entities = await this._api.get(...ids);

        if (entities.length > 0) {
            this._api.send(entities, false)
        }

        return entities as TEntity[];
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {

        const data = await this._all();
        const result = [...data].find(selector);

        if (result) {
            this._api.send([result], false)
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

    async link(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        // Find the existing _rev just in case it's not in sync
        const found = await this._api.get(...entities.map(w => w._id));

        if (found.length != entities.length) {
            throw new Error(`Error linking entities, document not found`)
        }

        const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as IIndexableEntity);

        entities.forEach(w => {
            this._api.makeTrackable(w, this._defaults);
            (w as any)._rev = foundDictionary[w._id]
        });

        this._api.send(entities, true)
    }

    async attach(...entities: TEntity[]) {
        await this.link(...entities);
    }

    async first() {
        const data = await this._all();
        const result = data[0];

        if (result) {
            this._api.send([result], false)
        }

        return result;
    }

    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>) {
        this._events[event].push(callback);
    }
}