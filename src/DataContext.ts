import PouchDB from 'pouchdb';
import { PRISTINE_ENTITY_KEY } from "./DbSet";
import findAdapter from 'pouchdb-find';
import memoryAdapter from 'pouchdb-adapter-memory';
import { DatabaseConfigurationAdditionalConfiguration, DataContextEvent, DataContextEventCallback, DataContextOptions, DeepPartial, IBulkDocsResponse, IDataContext, IDbRecord, IDbRecordBase, IDbSet, IDbSetApi, IDbSetBase, IPreviewChanges, IIndexableEntity, IPurgeResponse, ITrackedData, OmittedEntity } from './typings';
import { AdvancedDictionary } from './AdvancedDictionary';
import { DbSetBuilder, PropertyMap } from './DbSetBuilder';
import { IndexApi, IIndexApi } from './IndexApi';

PouchDB.plugin(findAdapter);
PouchDB.plugin(memoryAdapter);

abstract class PouchDbBase {

    protected readonly _dbOptions?: PouchDB.Configuration.DatabaseConfiguration;
    private readonly _dbName?: string;

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._dbOptions = options;
        this._dbName = name;
    }

    protected createDb() {
        return new PouchDB(this._dbName, this._dbOptions);
    }

    protected async doWork<T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose: boolean = true) {
        const db = this.createDb();
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
     * Does a bulk operation in the data store
     * @param entities 
     */
    protected async bulkDocs(entities: IDbRecordBase[]) {

        const response = await this.doWork(w => w.bulkDocs(entities));

        const result: {
            errors: { [key: string]: IBulkDocsResponse },
            errors_count: number,
            successes: { [key: string]: IBulkDocsResponse },
            successes_count: number
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
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids 
     */
    protected async getStrict(...ids: string[]) {

        if (ids.length === 0) {
            return [];
        }

        const result = await this.doWork(w => w.bulkGet({ docs: ids.map(x => ({ id: x })) }));

        return result.results.map(w => {
            const result = w.docs[0];

            if ('error' in result) {
                throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`)
            }

            return result.ok as IDbRecordBase;
        });
    }

    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids 
     */
    protected async get(...ids: string[]) {

        try {

            const result = await this.doWork(w => w.find({
                selector: {
                    _id: {
                        $in: ids
                    }
                }
            }), false);

            return result.docs as IDbRecordBase[];
        } catch (e) {

            if ('message' in e && e.message.includes("database is closed")) {
                throw e;
            }

            return [] as IDbRecordBase[];
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

            if ('message' in e && e.message.includes("database is closed")) {
                throw e;
            }

            return [] as IDbRecordBase[];
        }
    }
}

export class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {

    static PROXY_MARKER: string = '__isProxy';

    protected _removals: IDbRecordBase[] = [];
    protected _additions: IDbRecordBase[] = [];
    protected _attachments: AdvancedDictionary<IDbRecordBase> = new AdvancedDictionary<IDbRecordBase>("_id");

    protected _removeById: string[] = [];
    private _configuration: DatabaseConfigurationAdditionalConfiguration;

    $indexes: IIndexApi;

    private _events: { [key in DataContextEvent]: DataContextEventCallback<TDocumentType>[] } = {
        "entity-created": [],
        "entity-removed": [],
        "entity-updated": []
    }

    private _dbSets: { [key: string]: IDbSetBase<string> } = {} as { [key: string]: IDbSetBase<string> };

    constructor(name?: string, options?: DataContextOptions) {
        const { ...pouchDb } = options ?? {};
        super(name, pouchDb);

        this._configuration = {

        };

        this.$indexes = new IndexApi(this.doWork.bind(this));
    }

    async getAllDocs() {

        const all = await this.getAllData();

        return all.map(w => {

            const dbSet = this._dbSets[w.DocumentType] as (IDbSet<any, any, any> | undefined);

            if (dbSet) {
                const info = dbSet.info();

                return this._makeTrackable(w, info.Defaults.retrieve, info.Readonly, info.Map)
            }

            return w
        });
    }

    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns void
     */
    async optimize() {

        // once this index is created any read's will rebuild the index 
        // automatically.  The first read may be slow once new data is created
        await this.$indexes.create(w =>
            w.name("autogen_document-type-index")
                .designDocumentName("autogen_document-type-index")
                .fields(x => x.add("DocumentType")));
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
            get: this.get.bind(this),
            getStrict: this.getStrict.bind(this)
        }
    }

    private _addDbSet(dbset: IDbSetBase<string>) {

        const info = (dbset as IDbSet<any, any, any>).info();

        if (this._dbSets[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`)
        }

        this._dbSets[info.DocumentType] = dbset;
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _detach(data: IDbRecordBase[]) {
        this._attachments.remove(...data);
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _sendData(data: IDbRecordBase[]) {
        this._attachments.push(...data)
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

    private _reinitialize(removals: IDbRecordBase[] = [], add: IDbRecordBase[] = []) {
        this._additions = [];
        this._removals = [];
        this._removeById = [];

        this._attachments.remove(...removals);

        // move additions to attachments so we can track changes
        this._attachments.push(...add);
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

    private _makeTrackable<T extends Object>(entity: T, defaults: DeepPartial<OmittedEntity<T>>, readonly: boolean, maps: PropertyMap<any, any, any>[]): T {
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
            },
            get: (target, property, receiver) => {

                if (property === DataContext.PROXY_MARKER) {
                    return true;
                }

                return Reflect.get(target, property, receiver);
            }
        }

        const mergedInstance = { ...defaults, ...entity };
        let mappedInstance = {};

        if (maps.length > 0) {
            mappedInstance = maps.reduce((a, v) => {
                const preTransformValue = (mergedInstance as any)[v.property];
                return { ...a, [v.property]: Object.prototype.toString.call(preTransformValue) === '[object Date]' ? preTransformValue : v.map(preTransformValue) }
            }, {});
        }

        const instance = { ...mergedInstance, ...mappedInstance };
        const result = readonly ? Object.freeze(instance) : instance;

        return new Proxy(result, proxyHandler) as T
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

    async previewChanges(): Promise<IPreviewChanges> {
        const { add, remove, updated } = await this._getModifications();
        const clone = JSON.stringify({
            add,
            remove,
            update: updated
        });

        return JSON.parse(clone)
    }

    private _tryCallPostSaveEvents(changes: { remove: IDbRecordBase[], add: IDbRecordBase[], updated: IDbRecordBase[] }) {

        this._callEvents(changes.remove, "entity-removed");
        this._callEvents(changes.add, "entity-created");
        this._callEvents(changes.updated, "entity-updated");

    }

    private _callEvents(data: IDbRecordBase[], entityEvent: DataContextEvent) {
        if (data.length > 0) {

            if (this._events[entityEvent].length > 0) {
                data.forEach(w => this._events[entityEvent].forEach(x => x(w)))
            }
        }
    }

    private _makePristine(...entities: IDbRecordBase[]) {

        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i] as IIndexableEntity;

            // make pristine again
            delete indexableEntity[PRISTINE_ENTITY_KEY];
        }
    }

    private async _getModifications() {
        const { add, remove, removeById, updated } = this._getPendingChanges();

        const extraRemovals = await this.getStrict(...removeById);

        return {
            add,
            remove: [...remove, ...extraRemovals].map(w => ({ _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true })),
            updated
        }
    }


    async saveChanges() {
        try {
            const { add, remove, updated } = await this._getModifications();

            // Process removals first, so we can remove items first and then add.  Just
            // in case are are trying to remove and add the same Id
            const modifications = [...remove, ...add, ...updated];

            // remove pristine entity before we send to bulk docs
            this._makePristine(...modifications)

            const modificationResult = await this.bulkDocs(modifications);

            for (let i = 0; i < modifications.length; i++) {
                const modification = modifications[i];
                const found = modificationResult.successes[modification._id];

                // update the rev in case we edit the record again
                if (found && found.ok === true) {
                    const indexableEntity = modification as IIndexableEntity;
                    indexableEntity._rev = found.rev;

                    // make pristine again because we set the _rev above
                    this._makePristine(modification);
                }
            }

            // removals are being grouped with updates, 
            // need to separate out calls to events so we don't double dip
            // on updates and removals
            this._tryCallPostSaveEvents({ remove, add, updated });

            this._reinitialize(remove, add);

            return modificationResult.successes_count;
        } catch (e) {
            this._reinitialize()
            throw e;
        }
    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns DbSetBuilder
     */
    protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType) {
        return new DbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity>>(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false
        });
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

    async empty() {

        for (let dbset of this) {
            await dbset.empty();
        }

        await this.saveChanges();
    }

    async destroyDatabase() {
        await this.doWork(w => w.destroy(), false)
    }

    async purge(purgeType: "memory" | "disk" = "memory") {

        return await this.doWork(async source => {

            const options: PouchDB.Configuration.DatabaseConfiguration = {};

            if (purgeType === 'memory') {
                options.adapter = purgeType;
            }

            const dbInfo = await source.info();

            const temp = new PouchDB('__pdb-ef_purge', options);
            const replicationResult = await source.replicate.to(temp, {
                filter: doc => {
                    if (doc._deleted === true) {
                        return false
                    }

                    return doc;
                }
            });

            if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
                try {
                    await temp.destroy();
                } catch { } // swallow any potential destroy error
                throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`)
            }

            // destroy the source database
            await source.destroy();
            let closeDestination = true;

            return await this.doWork(async destination => {
                try {
                    const replicationResult = await temp.replicate.to(destination);

                    if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
                        try {
                            closeDestination = false;
                            await destination.destroy();
                        } catch { } // swallow any potential destroy error
                        throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`)
                    }

                    return {
                        doc_count: replicationResult.docs_written,
                        loss_count: Math.abs(dbInfo.doc_count - replicationResult.docs_written)
                    } as IPurgeResponse;
                } catch (e) {

                }
            }, closeDestination)
        }, false);
    }

    static asUntracked<T extends IDbRecordBase>(...entities: IDbRecordBase[]) {
        return entities.map(w => ({ ...w } as T));
    }

    static isProxy(entities: IDbRecordBase) {
        return (entities as IIndexableEntity)[DataContext.PROXY_MARKER] === true;
    }

    static merge<T extends IDbRecordBase>(to: T, from: T) {
        for(let property in from) {
            const value = from[property];
            to[property] = value;
        }
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = Object.keys(this._dbSets).map(w => this._dbSets[w]);

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}