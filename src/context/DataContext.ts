import PouchDB from 'pouchdb';
import findAdapter from 'pouchdb-find';
import memoryAdapter from 'pouchdb-adapter-memory';
import { AdvancedDictionary } from "../common/AdvancedDictionary";
import { cache } from "../cache/ContextCache";
import { PropertyMap, DbSetBuilder } from "./dbset/DbSetBuilder";
import { IIndexApi, IndexApi } from "../indexing/IndexApi";
import { CacheKeys } from "../types/cache-types";
import { DeepPartial, DocumentReference, IPreviewChanges, IPurgeResponse } from "../types/common-types";
import { IDataContext, DatabaseConfigurationAdditionalConfiguration, DataContextEvent, DataContextEventCallback, DataContextOptions, ITrackedData } from "../types/context-types";
import { IDbSetBase, IDbSet, IDbSetApi } from "../types/dbset-types";
import { IDbRecordBase, OmittedEntity, IIndexableEntity, IDbRecord, IReferenceDbRecord, ReferenceDocumentPropertyName, ReferencePathPropertyName } from "../types/entity-types";
import { PouchDbInteractionBase } from "./PouchDbInteractionBase";
import { parseDocumentReference } from '../common/LinkedDatabase';

PouchDB.plugin(findAdapter);
PouchDB.plugin(memoryAdapter);

export class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {

    protected readonly PRISTINE_ENTITY_KEY = "__pristine_entity__";
    protected readonly DIRTY_ENTITY_MARKER = "__isDirty";
    static PROXY_MARKER: string = '__isProxy';

    protected _removals: IDbRecordBase[] = [];
    protected _additions: IDbRecordBase[] = [];
    protected _attachments: AdvancedDictionary<IDbRecordBase> = new AdvancedDictionary<IDbRecordBase>("_id");

    protected _removeById: string[] = [];
    private _configuration: DatabaseConfigurationAdditionalConfiguration;
    private _hasReferenceDbSet: boolean = false;

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

        cache.upsert(CacheKeys.IsOptimized, true)
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
            getStrict: this.getStrict.bind(this),
            map: this._map.bind(this),
            DIRTY_ENTITY_MARKER: this.DIRTY_ENTITY_MARKER,
            PRISTINE_ENTITY_KEY: this.PRISTINE_ENTITY_KEY
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

    private _map<T extends Object>(entity: T, maps: PropertyMap<any, any, any>[], defaults: DeepPartial<OmittedEntity<T>> = {} as any) {
        const mergedInstance = { ...defaults, ...entity };
        let mappedInstance = {};

        if (maps.length > 0) {
            mappedInstance = maps.reduce((a, v) => {
                const preTransformValue = (mergedInstance as any)[v.property];
                return { ...a, [v.property]: Object.prototype.toString.call(preTransformValue) === '[object Date]' ? preTransformValue : v.map(preTransformValue) }
            }, {});
        }

        return { ...mergedInstance, ...mappedInstance };
    }

    private _makeTrackable<T extends Object>(entity: T, defaults: DeepPartial<OmittedEntity<T>>, readonly: boolean, maps: PropertyMap<any, any, any>[]): T {
        const proxyHandler: ProxyHandler<T> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property === this.DIRTY_ENTITY_MARKER) {

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY] = {};
                    }

                    indexableEntity[this.PRISTINE_ENTITY_KEY][this.DIRTY_ENTITY_MARKER] = true;
                    return true;
                }

                if (property !== this.PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY][key] = oldValue;
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

        const instance = this._map(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return new Proxy(result, proxyHandler) as T
    }

    private _getPendingChanges() {
        const { add, remove, removeById } = this._getTrackedData();

        const updated = this._attachments.filter(w => {

            const indexableEntity = w as IIndexableEntity;
            if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                return false;
            }

            const pristineKeys = Object.keys(indexableEntity[this.PRISTINE_ENTITY_KEY]);

            for (let pristineKey of pristineKeys) {
                if (indexableEntity[this.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
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
            delete indexableEntity[this.PRISTINE_ENTITY_KEY];
        }
    }

    private async _getModifications() {
        const { add, remove, removeById, updated } = this._getPendingChanges();

        const extraRemovals = await this.getStrict(...removeById);

        return {
            add,
            remove: [...remove, ...extraRemovals].map(w => ({ _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true } as IDbRecordBase)),
            updated
        }
    }


    async saveChanges() {
        try {
            const { add, remove, updated } = await this._getModifications();

            // Process removals first, so we can remove items first and then add.  Just
            // in case are are trying to remove and add the same Id
            const modifications = [...remove, ...add, ...updated];

            if (this._hasReferenceDbSet === true) {
                const referenceModifications: { [key: string]: { hasRemovals: boolean, documents: IDbRecordBase[] } } = {};

                if (modifications.length > 0) {
                    // keep the path and tear off the references
                    for (const item of modifications) {
                        const castedItem = (item as IReferenceDbRecord<TDocumentType, any, any>);
                        const document = castedItem[ReferenceDocumentPropertyName] as IDbRecordBase;
                        const referencePath = castedItem[ReferencePathPropertyName] as string;
                        const reference = parseDocumentReference(referencePath)
                        delete castedItem[ReferenceDocumentPropertyName];

                        if (!referenceModifications[reference.databaseName]) {
                            referenceModifications[reference.databaseName] = {
                                documents: [],
                                hasRemovals: false
                            }
                        }

                        if (referenceModifications[reference.databaseName].hasRemovals === false && "_deleted" in item) {
                            referenceModifications[reference.databaseName].hasRemovals = true;
                        }

                        referenceModifications[reference.databaseName].documents.push(document);
                    }
                }

                for (const group in referenceModifications) {
                    const documents = referenceModifications[group].documents;
                    const db = new PouchDB(group);
                    await db.bulkDocs(documents);

                    if (referenceModifications[group].hasRemovals === true) {
                        const all = await db.allDocs({ include_docs: false });
                        if (all.rows.length === 0) {
                            await db.destroy();
                        }
                    }
                }
            }

            // remove pristine entity before we send to bulk docs
            this._makePristine(...modifications);

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

            await this.onAfterSaveChanges({ adds: add.length, removes: remove.length, updates: updated.length })

            this._reinitialize(remove, add);

            return modificationResult.successes_count;
        } catch (e) {
            this._reinitialize()
            throw e;
        }
    }

    protected async onAfterSaveChanges(modifications: { adds: number, removes: number, updates: number }) {

    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns {DbSetBuilder}
     */
    protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType) {
        return new DbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity>>(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false,
            isReferenceDbSet: false
        });
    }

    protected referenceDbSet<TReferenceDocumentType extends string, TReferenceEntity extends IDbRecord<TReferenceDocumentType>, TEntity extends IReferenceDbRecord<TDocumentType, TReferenceDocumentType, TReferenceEntity>>(documentType: TDocumentType) {

        this._hasReferenceDbSet = true;

        return new DbSetBuilder<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType", IDbSet<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType">>(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false,
            isReferenceDbSet: true
        });
    }

    async query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>) {
        return await this.doWork(w => callback(w))
    }

    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }

    // on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>) {
    //     this._events[event].push(callback);
    // }

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
                    throw e;
                }
            }, closeDestination)
        }, false);
    }

    static asUntracked<T extends IDbRecordBase>(...entities: T[]) {
        return entities.map(w => ({ ...w } as T));
    }

    static isProxy(entities: IDbRecordBase) {
        return (entities as IIndexableEntity)[DataContext.PROXY_MARKER] === true;
    }

    static isDate(value: any) {
        return Object.prototype.toString.call(value) === '[object Date]'
    }

    static merge<T extends IDbRecordBase>(to: T, from: T, options?: { skip?: string[]; }) {
        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
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