import PouchDB from 'pouchdb';
import { DbSet, PRISTINE_ENTITY_KEY } from "./DbSet";
import findAdapter from 'pouchdb-find';
import { DatabaseConfigurationAdditionalConfiguration, DataContextEvent, DataContextEventCallback, DataContextOptions, EntityIdKeys, IBulkDocsResponse, IDataContext, IDbAdditionRecord, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, IDbSetBase, IIndexableEntity, ITrackedData } from './typings';

PouchDB.plugin(findAdapter);

abstract class PouchDbBase {

    private _options?: PouchDB.Configuration.DatabaseConfiguration;
    private _name?: string;

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._options = options;
        this._name = name;

    }

    protected async doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose: boolean = true) {
        const db = new PouchDB(this._name, this._options);
        const result = await action(db);

        if (shouldClose) {
            await db.close();
        }

        return result;
    }
}

abstract class PouchDbInteractionBase<TDocumentType extends string> extends PouchDbBase {

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        super(name, options);
    }

    /**
    * Inserts entity into the data store, this is used by DbSet
    * @param entities 
    * @param onComplete 
    */
    protected async insertEntity(onComplete: (result: IDbRecord<any>) => void, ...entities: IDbAdditionRecord<any>[]) {

        const response = await this.doWork(async w => {

            return await Promise.all(entities.map(async e => {

                const result: IDbRecord<any> = e as any;
                const response = await w.post(e);

                (result as any)._rev = response.rev;

                if (!result._id) {
                    (result as any)._id = response.id;
                }

                onComplete(result);

                return response;
            }));
        });

        return response.map(w => w.ok);
    }

    /**
     * Does a bulk operation in the data store
     * @param entities 
     */
    protected async bulkDocs(entities: IDbRecordBase[]) {

        const response = await this.doWork(w => w.bulkDocs(entities));

        const result: {
            errors: { [key: string]: IBulkDocsResponse },
            errors_count: number,
            successes: { [key: string]: IBulkDocsResponse },
            successes_count:number
        } = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };

        for (let item of response) {
            if ('error' in item) {
                const error = item as PouchDB.Core.Error;

                result.errors_count += 1;
                result.errors[error.id] = {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                } as IBulkDocsResponse;
                continue;
            }

            const success = item as PouchDB.Core.Response;

            result.successes_count += 1;
            result.successes[success.id] = {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            } as IBulkDocsResponse;
        }

        return result;
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity 
     */
    protected async removeEntity(...entity: IDbRecordBase[]) {
        const response = await this.doWork(w => w.remove(entity as any));
        return response.ok;
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param ids 
     */
    protected async removeEntityById(onResponse: (entity: IDbRecordBase) => void, ...ids: string[]) {
        const result = await this.doWork(async w => {

            return await Promise.all(ids.map(async id => {
                const entity = await w.get(id);
                const response = await w.remove(entity);

                onResponse(entity as any);

                return response;
            }))
        });

        return result.map(w => w.ok);
    }

    /**
     * Get entity from the data store, this is used by DbSet
     * @param id 
     */
    protected async getEntity(id: string) {
        try {
            return await this.doWork(w => w.get<IDbRecordBase>(id));
        } catch (e) {
            return null
        }
    }

    /**
     * Gets all data from the data store
     */
    protected async getAllData(documentType?: TDocumentType) {

        try {
            const findOptions: PouchDB.Find.FindRequest<IDbRecordBase> = {
                selector: {},
            }

            if (documentType != null) {
                findOptions.selector.DocumentType = documentType;
            }

            const result = await this.doWork(w => w.find(findOptions));

            return result.docs as IDbRecordBase[];
        } catch (e) {
            console.log(e);
            return [] as IDbRecordBase[];
        }

    }
}

export class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {

    protected _removals: IDbRecordBase[] = [];
    protected _additions: IDbRecordBase[] = [];
    protected _attachments: IDbRecordBase[] = [];

    protected _removeById: string[] = [];
    private _configuration: DatabaseConfigurationAdditionalConfiguration;

    private _events: { [key in DataContextEvent]: DataContextEventCallback<TDocumentType>[] } = {
        "entity-created": [],
        "entity-removed": [],
        "entity-updated": []
    }

    private _dbSets: IDbSetBase<string>[] = [];

    constructor(name?: string, options?: DataContextOptions) {
        const { documentTypeIndex, ...pouchDb } = options ?? {};
        super(name, pouchDb);

        this._configuration = {
            documentTypeIndex: documentTypeIndex ?? "create"
        };
    }

    async getAllDocs() {
        return this.getAllData();
    }

    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext() { return this; }

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
            makeTrackable: this._makeTrackable.bind(this),
            get: this.getEntity.bind(this)
        }
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _detach(data: IDbRecordBase[]) {
        this._attachments = this._attachments.filter(w => data.some(x => x._id === w._id) === false);
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
        this._attachments = [...this._attachments, ...data];
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

    private async _tryCreateDocumentTypeIndex() {

        if (this._configuration.documentTypeIndex === "create") {

            // Create if not exists, do nothing if exists
            await this.doWork(async w => {

                const result = await w.getIndexes();

                if (result.indexes.some(w => w.ddoc === "document-type-index") === false) {
                    await w.createIndex({
                        index: {
                            fields: ["DocumentType"],
                            name: 'document-type-index',
                            ddoc: "document-type-index"
                        },
                    })
                }
            });
        }
    }

    async generateDocumentTypeIndex() {
        await this.doWork(async w => {

            await w.createIndex({
                index: {
                    fields: ["DocumentType"],
                    name: 'document-type-index',
                    ddoc: "document-type-index"
                },
            })
        });
    }

    async saveChanges() {
        try {

            const { add, remove, removeById, updated } = this._getPendingChanges();

            // remove pristine entity before we send to bulk docs
            [...add, ...remove, ...updated].forEach(w => this._makePristine(w))

            const addsWithIds = add.filter(w => w._id != null);
            const addsWithoutIds = add.filter(w => w._id == null);
            const modifications = [...updated, ...addsWithIds, ...remove.map(w => ({ ...w, _deleted: true }))];
            const modificationResult = await this.bulkDocs(modifications);

            for (let modification of modifications) {

                const found = modificationResult.successes[modification._id];

                // update the rev in case we edit the record again
                if (found && found.ok === true) {
                    const indexableEntity = modification as IIndexableEntity;
                    indexableEntity._rev = found.rev;

                    // make pristine again because we set the _rev above
                    this._makePristine(modification);
                }
            }

            const additionsWithNoIds = await this.addEntityWithoutId(entity => this._events["entity-created"].forEach(w => w(entity)), ...addsWithoutIds);
            const removalsById = await this.removeEntityById(entity => this._events["entity-removed"].forEach(w => w(entity)), ...removeById)

            // removals are being grouped with updates, 
            // need to separate out calls to events so we don't double dip
            // on updates and removals
            this._tryCallEvents({ remove, add: addsWithIds, updated });

            this.reinitialize(remove, removeById, add);

            return [...removalsById, ...additionsWithNoIds].filter(w => w === true).length + modificationResult.successes_count;
        } catch (e) {
            this.reinitialize()
            throw e;
        }
    }

    protected async addEntityWithoutId(onComplete: (result: IDbRecord<any>) => void, ...entities: IDbRecordBase[]) {
        return await this.insertEntity(onComplete, ...entities);
    }

    protected createDbSet<TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) | void = void>(documentType: TDocumentType, ...idKeys: EntityIdKeys<TDocumentType, TEntity>): IDbSet<TDocumentType, TEntity, TExtraExclusions> {
        const dbSet = new DbSet<TDocumentType, TEntity, TExtraExclusions>(documentType, this, ...idKeys);

        this._dbSets.push(dbSet);

        return dbSet;
    }

    async query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>) {
        return await this.doWork(w => callback(w))
    }

    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }

    on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>) {
        this._events[event].push(callback);
    }

    async destroyDatabase() {
        await this.doWork(w => w.destroy(), false)
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = this._dbSets;

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}