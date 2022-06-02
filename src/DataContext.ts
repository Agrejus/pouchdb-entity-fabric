import PouchDB from 'pouchdb';
import { DbSet, PRISTINE_ENTITY_KEY } from "./DbSet";
import findAdapter from 'pouchdb-find';
import { DataContextEvent, DataContextEventCallback, EntityIdKeys, IBulkDocsResponse, IDataContext, IDbAdditionRecord, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, IDbSetBase, IIndexableEntity, ITrackedData } from './typings';

PouchDB.plugin(findAdapter);

export class DataContext<TDocumentType extends string> implements IDataContext {

    protected _db: PouchDB.Database;
    protected _removals: IDbRecordBase[] = [];
    protected _additions: IDbRecordBase[] = [];
    protected _attachments: IDbRecordBase[] = [];
    protected _removeById: string[] = [];
    protected _collectionName!: string;
    private _events: { [key in DataContextEvent]: DataContextEventCallback<TDocumentType>[] } = {
        "entity-created": [],
        "entity-removed": [],
        "entity-updated": []
    }

    private _dbSets: IDbSetBase<string>[] = [];

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._db = new PouchDB(name, options);
    }

    /**
     * Gets all data from the data store
     */
    protected async getAllData(documentType?: TDocumentType) {

        const findOptions: PouchDB.Find.FindRequest<IDbRecordBase> = {
            selector: {}
        }

        if (documentType != null) {
            findOptions.selector.DocumentType = documentType;
        }

        const result = await this._db.find(findOptions);

        return result.docs as IDbRecordBase[];
    }

    async getAllDocs() {
        return this.getAllData();
    }

    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext() { return this; }

    /**
     * Inserts entity into the data store, this is used by DbSet
     * @param entity 
     * @param onComplete 
     */
    protected async insertEntity(entity: IDbAdditionRecord<any>, onComplete?: (result: IDbRecord<any>) => void) {
        const response = await this._db.post(entity);
        const result: IDbRecord<any> = entity as any;

        (result as any)._rev = response.rev;

        if (!result._id) {
            (result as any)._id = response.id;
        }

        if (onComplete != null) {
            onComplete(result);
        }

        return response.ok;
    }

    /**
     * Updates entity in the data store, this is used by DbSet
     * @param entity 
     * @param onComplete 
     */
    protected async updateEntity(entity: IDbRecordBase, onComplete: (result: IDbRecord<any>) => void): Promise<boolean> {

        try {
            const response = await this._db.put(entity);
            const result: IDbRecord<any> = entity as any;

            (result as any)._rev = response.rev;

            onComplete(result);

            return response.ok;
        } catch {
            const found = await this.getEntity(entity._id);

            const result: IDbRecord<any> = entity as any;

            (result as any)._rev = found!._id;

            const response = await this._db.put(result);

            (result as any)._rev = response.rev;

            onComplete(result);

            return response.ok;
        }
    }

    /**
     * Does a bulk operation in the data store
     * @param entities 
     */
    protected async bulkDocs(entities: IDbRecordBase[]): Promise<IBulkDocsResponse[]> {

        const response = await this._db.bulkDocs(entities);

        return response.map(w => {

            if ('error' in w) {
                const error = w as PouchDB.Core.Error;

                return {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                } as IBulkDocsResponse;
            }

            const success = w as PouchDB.Core.Response;

            return {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            } as IBulkDocsResponse
        });
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity 
     */
    protected async removeEntity(entity: IDbRecordBase) {
        const response = await this._db.remove(entity as any);
        return response.ok;
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param id 
     */
    protected async removeEntityById(id: string) {
        const entity = await this._db.get(id);
        const response = await this._db.remove(entity);

        this._events["entity-removed"].forEach(w => w(entity as any));

        return response.ok;
    }

    /**
     * Get entity from the data store, this is used by DbSet
     * @param id 
     */
    protected async getEntity(id: string) {
        try {
            return await this._db.get<IDbRecordBase>(id);
        } catch (e) {
            return null
        }
    }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi(): IDbSetApi<TDocumentType> {
        return {
            getTrackedData: this._getTrackedData.bind(this),
            getAllData: this.getAllData.bind(this),
            send: this._sendData.bind(this),
            detach: this._detach.bind(this),
            makeTrackable: this._makeTrackable.bind(this)
        }
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _detach(data: IDbRecordBase[]) {

        const result: IDbRecordBase[] = [];
        for (let i = 0; i < data.length; i++) {
            const detachment = data[i];
            const index = this._attachments.findIndex(w => w._id === detachment._id)

            if (index === -1) {
                continue;
            }

            const clone: IDbRecordBase = JSON.parse(JSON.stringify(this._attachments[index]));

            this._attachments.splice(index, 1);

            result.push(clone);
        }

        return result;
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _sendData(data: IDbRecordBase[], shouldThrowOnDuplicate: boolean) {
        if (shouldThrowOnDuplicate) {
            const duplicate = this._attachments.find(w => data.some(x => x._id === w._id));

            if (duplicate) {
                throw new Error(`DataContext already contains item with the same id, cannot add more than once.  _id: ${duplicate._id}`);
            }
        }

        this._setAttachments(data);
    }

    private _setAttachments(data: IDbRecordBase[]) {
        // do not filter duplicates in case devs return multiple instances of the same entity
        this._attachments = [...this._attachments, ...data];//.filter((value, index, self) =>  index === self.findIndex((t) => t._id === value._id));
    }

    /**
     * Used by the context api
     */
    private _getTrackedData() {
        return {
            add: this._additions,
            remove: this._removals,
            attach: this._attachments,
            removeById: this._removeById
        } as ITrackedData;
    }

    private reinitialize(removals: IDbRecordBase[] = [], removalsById: string[] = [], add: IDbRecordBase[] = []) {
        this._additions = [];
        this._removals = [];
        this._removeById = [];

        // remove attached tracking changes
        for (let item of this._attachments) {
            const indexableEntity: IIndexableEntity = item as any;
            delete indexableEntity[PRISTINE_ENTITY_KEY];
        }

        for (let removal of removals) {
            const index = this._attachments.findIndex(w => w._id === removal._id);

            if (index !== -1) {
                this._attachments.splice(index, 1)
            }
        }

        for (let removalById of removalsById) {
            const index = this._attachments.findIndex(w => w._id === removalById);

            if (index !== -1) {
                this._attachments.splice(index, 1)
            }
        }

        // move additions to attachments so we can track changes
        this._setAttachments(add);
    }

    /**
     * Provides equality comparison for Entities
     * @param first 
     * @param second 
     * @returns boolean
     */
    private areEqual(first: IDbRecordBase, second: IDbRecordBase) {

        if (!first && !second) {
            return true;
        }

        if (!first || !second) {
            return false;
        }

        const skip = ["_id", "_rev"];
        const keys = Object.keys(first).filter(w => skip.includes(w) === false);

        return keys.some(w => {
            const firstPropertyValue = (first as any)[w];
            const secondPropertyValue = (second as any)[w];

            if (Array.isArray(firstPropertyValue) && Array.isArray(secondPropertyValue)) {
                return firstPropertyValue.length === secondPropertyValue.length && firstPropertyValue.every((val, index) => val === secondPropertyValue[index]);
            }

            return (first as any)[w] != (second as any)[w]
        }) === false;
    }

    private _makeTrackable<T extends Object>(entity: T): T {
        const proxyHandler: ProxyHandler<T> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property !== PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    if (indexableEntity[PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[PRISTINE_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[PRISTINE_ENTITY_KEY][key] = oldValue;
                    }
                }

                indexableEntity[key] = value;

                return true;
            }
        }

        return new Proxy(entity, proxyHandler) as any
    }

    private _getPendingChanges() {
        const { add, remove, removeById } = this._getTrackedData();
        const updated = this._attachments.filter(w => {

            const indexableEntity = w as IIndexableEntity;
            if (indexableEntity[PRISTINE_ENTITY_KEY] === undefined) {
                return false;
            }

            const pristineKeys = Object.keys(indexableEntity[PRISTINE_ENTITY_KEY]);

            for (let pristineKey of pristineKeys) {
                if (indexableEntity[PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                    return true
                }
            }

            return false;
        });

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    private _tryCallEvents(changes: { remove: IDbRecordBase[], add: IDbRecordBase[], updated: IDbRecordBase[] }) {

        if (this._events["entity-removed"].length > 0 && changes.remove.length > 0) {
            changes.remove.forEach(w => this._events["entity-removed"].forEach(x => x(w)))
        }

        if (this._events["entity-created"].length > 0 && changes.add.length > 0) {
            changes.add.forEach(w => this._events["entity-created"].forEach(x => x(w)))
        }

        if (this._events["entity-updated"].length > 0 && changes.updated.length > 0) {
            changes.updated.forEach(w => this._events["entity-updated"].forEach(x => x(w)))
        }
    }

    private _makePristine(entity: IDbRecordBase) {
        const indexableEntity = entity as IIndexableEntity;

        // make pristine again
        delete indexableEntity[PRISTINE_ENTITY_KEY];
    }

    async saveChanges() {
        try {

            const { add, remove, removeById, updated } = this._getPendingChanges();

            // remove pristine entity
            [...add, ...remove, ...updated].forEach(w => this._makePristine(w))

            const addsWithIds = add.filter(w => !!w._id);
            const addsWithoutIds = add.filter(w => w._id == null);
            const modifications = [...updated, ...addsWithIds, ...remove.map(w => ({ ...w, _deleted: true }))];
            const modificationResult = await this.bulkDocs(modifications);
            const successfulModifications = modificationResult.filter(w => w.ok === true);

            for (let modification of modifications) {

                const found = successfulModifications.find(w => w.id === modification._id);
                // update the rev in case we edit the record again
                if (found && found.ok === true) {
                    const indexableEntity = modification as IIndexableEntity;
                    indexableEntity._rev = found.rev;

                    // make pristine again
                    this._makePristine(modification);
                }
            }

            const additionsWithGeneratedIds = await Promise.all(addsWithoutIds.map(w => this.addEntityWithoutId(w)))
            const removalsById = await Promise.all(removeById.map(w => this.removeEntityById(w)));

            // removals are being grouped with updates, 
            // need to separate out calls to events so we don't double dip
            // on updates and removals
            this._tryCallEvents({ remove, add, updated });

            this.reinitialize(remove, removeById, add);

            return [...removalsById, ...additionsWithGeneratedIds, ...modificationResult.map(w => {

                return w.ok;
            })].filter(w => w === true).length;
        } catch (e) {
            this.reinitialize()
            throw e;
        }
    }

    protected addEntityWithoutId(entity: IDbRecordBase) {
        return new Promise<IBulkDocsResponse>(async (resolve, reject) => {
            try {
                const result = await this.insertEntity(entity);

                resolve({ ok: result, id: "", rev: "" })
            } catch (e) {
                console.error(e);
                reject({ ok: false, id: "", rev: "" })
            }
        })
    }

    protected createDbSet<TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) | void = void>(documentType: TDocumentType, ...idKeys: EntityIdKeys<TDocumentType, TEntity>): IDbSet<TDocumentType, TEntity, TExtraExclusions> {
        const dbSet = new DbSet<TDocumentType, TEntity, TExtraExclusions>(documentType, this, ...idKeys);

        this._dbSets.push(dbSet);

        return dbSet;
    }

    async query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>) {
        return await callback(this._db);
    }

    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }

    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>) {
        this._events[event].push(callback);
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = this._dbSets;

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}