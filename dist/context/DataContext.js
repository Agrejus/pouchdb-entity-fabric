"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataContext = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
const pouchdb_find_1 = __importDefault(require("pouchdb-find"));
const pouchdb_adapter_memory_1 = __importDefault(require("pouchdb-adapter-memory"));
const AdvancedDictionary_1 = require("../common/AdvancedDictionary");
const ContextCache_1 = require("../cache/ContextCache");
const DbSetBuilder_1 = require("./dbset/DbSetBuilder");
const IndexApi_1 = require("../indexing/IndexApi");
const cache_types_1 = require("../types/cache-types");
const entity_types_1 = require("../types/entity-types");
const PouchDbInteractionBase_1 = require("./PouchDbInteractionBase");
const LinkedDatabase_1 = require("../common/LinkedDatabase");
const AsyncCache_1 = require("../cache/AsyncCache");
pouchdb_1.default.plugin(pouchdb_find_1.default);
pouchdb_1.default.plugin(pouchdb_adapter_memory_1.default);
class DataContext extends PouchDbInteractionBase_1.PouchDbInteractionBase {
    constructor(name, options) {
        const pouchDb = __rest(options !== null && options !== void 0 ? options : {}, []);
        super(name, pouchDb);
        this.PRISTINE_ENTITY_KEY = "__pristine_entity__";
        this.DIRTY_ENTITY_MARKER = "__isDirty";
        this._removals = [];
        this._additions = [];
        this._attachments = new AdvancedDictionary_1.AdvancedDictionary("_id");
        this._removeById = [];
        this._hasReferenceDbSet = false;
        this._asyncCache = new AsyncCache_1.AsyncCache();
        this._dbSets = {};
        this._configuration = {};
        this.$indexes = new IndexApi_1.IndexApi(this.doWork.bind(this));
    }
    getAllDocs() {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield this.getAllData();
            return all.map(w => {
                const dbSet = this._dbSets[w.DocumentType];
                if (dbSet) {
                    const info = dbSet.info();
                    return this._makeTrackable(w, info.Defaults.retrieve, info.Readonly, info.Map);
                }
                return w;
            });
        });
    }
    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns void
     */
    optimize() {
        return __awaiter(this, void 0, void 0, function* () {
            // once this index is created any read's will rebuild the index 
            // automatically.  The first read may be slow once new data is created
            yield this.$indexes.create(w => w.name("autogen_document-type-index")
                .designDocumentName("autogen_document-type-index")
                .fields(x => x.add("DocumentType")));
            ContextCache_1.cache.upsert(cache_types_1.CacheKeys.IsOptimized, true);
        });
    }
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    getContext() { return this; }
    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    _getApi() {
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
            PRISTINE_ENTITY_KEY: this.PRISTINE_ENTITY_KEY,
            makePristine: this._makePristine.bind(this),
            find: this.find.bind(this)
        };
    }
    _addDbSet(dbset) {
        const info = dbset.info();
        if (this._dbSets[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`);
        }
        this._dbSets[info.DocumentType] = dbset;
    }
    /**
     * Used by the context api
     * @param data
     */
    _detach(data) {
        this._attachments.remove(...data);
    }
    /**
     * Used by the context api
     * @param data
     */
    _sendData(data) {
        this._attachments.push(...data);
    }
    /**
     * Used by the context api
     */
    _getTrackedData() {
        return {
            add: this._additions,
            remove: this._removals,
            attach: this._attachments,
            removeById: this._removeById
        };
    }
    _reinitialize(removals = [], add = []) {
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
    areEqual(first, second) {
        if (!first && !second) {
            return true;
        }
        if (!first || !second) {
            return false;
        }
        const skip = ["_id", "_rev"];
        const keys = Object.keys(first).filter(w => skip.includes(w) === false);
        return keys.some(w => {
            const firstPropertyValue = first[w];
            const secondPropertyValue = second[w];
            if (Array.isArray(firstPropertyValue) && Array.isArray(secondPropertyValue)) {
                return firstPropertyValue.length === secondPropertyValue.length && firstPropertyValue.every((val, index) => val === secondPropertyValue[index]);
            }
            return first[w] != second[w];
        }) === false;
    }
    _map(entity, maps, defaults = {}) {
        const mergedInstance = Object.assign(Object.assign({}, defaults), entity);
        let mappedInstance = {};
        if (maps.length > 0) {
            mappedInstance = maps.reduce((a, v) => {
                const preTransformValue = mergedInstance[v.property];
                return Object.assign(Object.assign({}, a), { [v.property]: Object.prototype.toString.call(preTransformValue) === '[object Date]' ? preTransformValue : v.map(preTransformValue) });
            }, {});
        }
        return Object.assign(Object.assign({}, mergedInstance), mappedInstance);
    }
    _makeTrackable(entity, defaults, readonly, maps) {
        const proxyHandler = {
            set: (entity, property, value) => {
                const indexableEntity = entity;
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
        };
        const instance = this._map(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;
        return new Proxy(result, proxyHandler);
    }
    _getPendingChanges() {
        const { add, remove, removeById } = this._getTrackedData();
        const updated = this._attachments.filter(w => {
            const indexableEntity = w;
            if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                return false;
            }
            const pristineKeys = Object.keys(indexableEntity[this.PRISTINE_ENTITY_KEY]);
            for (let pristineKey of pristineKeys) {
                if (indexableEntity[this.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                    return true;
                }
            }
            return false;
        });
        return {
            add,
            remove,
            removeById,
            updated
        };
    }
    previewChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const { add, remove, updated } = yield this._getModifications();
            const clone = JSON.stringify({
                add,
                remove,
                update: updated
            });
            return JSON.parse(clone);
        });
    }
    _makePristine(...entities) {
        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i];
            // make pristine again
            delete indexableEntity[this.PRISTINE_ENTITY_KEY];
        }
    }
    _getModifications() {
        return __awaiter(this, void 0, void 0, function* () {
            const { add, remove, removeById, updated } = this._getPendingChanges();
            const extraRemovals = yield this.getStrict(...removeById);
            return {
                add,
                remove: [...remove, ...extraRemovals].map(w => {
                    let result = { _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true };
                    if (w[entity_types_1.SplitDocumentPathPropertyName] != null) {
                        result = Object.assign(Object.assign({}, result), { [entity_types_1.SplitDocumentPathPropertyName]: w[entity_types_1.SplitDocumentPathPropertyName] });
                    }
                    if (w[entity_types_1.SplitDocumentDocumentPropertyName] != null) {
                        result = Object.assign(Object.assign({}, result), { [entity_types_1.SplitDocumentDocumentPropertyName]: w[entity_types_1.SplitDocumentDocumentPropertyName] });
                    }
                    return result;
                }),
                updated
            };
        });
    }
    _getCachedTempDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            let dblistEntity = yield this._asyncCache.get("temp-db-list");
            if (dblistEntity == null) {
                dblistEntity = {
                    _id: "temp-db-list",
                    list: []
                };
            }
            return dblistEntity;
        });
    }
    _setCachedTempDbs(list) {
        return __awaiter(this, void 0, void 0, function* () {
            const dblistEntity = yield this._getCachedTempDbs();
            dblistEntity.list.push(...list);
            yield this._asyncCache.set(dblistEntity);
        });
    }
    validateCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedDbListDocument = yield this._getCachedTempDbs();
            yield Promise.all(cachedDbListDocument.list.map(w => this._tryDestroyDatabase(new pouchdb_1.default(w))));
        });
    }
    _tryDestroyDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield db.allDocs({ include_docs: false });
            if (all.rows.length === 0) {
                yield db.destroy();
                return true;
            }
            return false;
        });
    }
    saveChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { add, remove, updated } = yield this._getModifications();
                // Process removals first, so we can remove items first and then add.  Just
                // in case are are trying to remove and add the same Id
                const modifications = [...remove, ...add, ...updated];
                if (this._hasReferenceDbSet === true) {
                    const referenceModifications = {};
                    if (modifications.length > 0) {
                        // keep the path and tear off the references
                        for (const item of modifications) {
                            const castedItem = item;
                            const document = castedItem[entity_types_1.SplitDocumentDocumentPropertyName];
                            const referencePath = castedItem[entity_types_1.SplitDocumentPathPropertyName];
                            const reference = (0, LinkedDatabase_1.parseDocumentReference)(referencePath);
                            const isDeletion = "_deleted" in castedItem;
                            if (isDeletion) {
                                delete castedItem[entity_types_1.SplitDocumentPathPropertyName];
                            }
                            delete castedItem[entity_types_1.SplitDocumentDocumentPropertyName];
                            if (!referenceModifications[reference.databaseName]) {
                                referenceModifications[reference.databaseName] = {
                                    documents: [],
                                    hasRemovals: false
                                };
                            }
                            if (referenceModifications[reference.databaseName].hasRemovals === false && "_deleted" in item) {
                                referenceModifications[reference.databaseName].hasRemovals = true;
                            }
                            // mark reference document for removal or not below
                            referenceModifications[reference.databaseName].documents.push(isDeletion === true ? Object.assign(Object.assign({}, document), { _deleted: true }) : document);
                        }
                    }
                    const cachedDbListDocument = yield this._getCachedTempDbs();
                    const dbList = new Set(cachedDbListDocument.list);
                    for (const group in referenceModifications) {
                        try {
                            const documents = referenceModifications[group].documents;
                            const referenceDb = new pouchdb_1.default(group);
                            dbList.add(group);
                            yield referenceDb.bulkDocs(documents);
                            if (referenceModifications[group].hasRemovals === true) {
                                const result = yield this._tryDestroyDatabase(referenceDb);
                                if (result) {
                                    dbList.delete(group);
                                }
                            }
                        }
                        catch (e) {
                            // Swallow error
                        }
                    }
                    yield this._setCachedTempDbs([...dbList]);
                }
                // remove pristine entity before we send to bulk docs
                this._makePristine(...modifications);
                const modificationResult = yield this.bulkDocs(modifications);
                for (let i = 0; i < modifications.length; i++) {
                    const modification = modifications[i];
                    const found = modificationResult.successes[modification._id];
                    // update the rev in case we edit the record again
                    if (found && found.ok === true) {
                        const indexableEntity = modification;
                        indexableEntity._rev = found.rev;
                        // make pristine again because we set the _rev above
                        this._makePristine(modification);
                    }
                }
                yield this.onAfterSaveChanges({ adds: add.length, removes: remove.length, updates: updated.length });
                this._reinitialize(remove, add);
                return modificationResult.successes_count;
            }
            catch (e) {
                this._reinitialize();
                throw e;
            }
        });
    }
    onAfterSaveChanges(modifications) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns {DbSetBuilder}
     */
    dbset(documentType) {
        return new DbSetBuilder_1.DbSetBuilder(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false,
            isSplitDbSet: false
        });
    }
    splitDbSet(documentType) {
        this._hasReferenceDbSet = true;
        return new DbSetBuilder_1.DbSetBuilder(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false,
            isSplitDbSet: true
        });
    }
    query(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.doWork(w => callback(w));
        });
    }
    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }
    empty() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let dbset of this) {
                yield dbset.empty();
            }
            yield this.saveChanges();
        });
    }
    destroyDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doWork(w => w.destroy(), false);
        });
    }
    purge(purgeType = "memory") {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.doWork((source) => __awaiter(this, void 0, void 0, function* () {
                const options = {};
                if (purgeType === 'memory') {
                    options.adapter = purgeType;
                }
                const dbInfo = yield source.info();
                const temp = new pouchdb_1.default('__pdb-ef_purge', options);
                const replicationResult = yield source.replicate.to(temp, {
                    filter: doc => {
                        if (doc._deleted === true) {
                            return false;
                        }
                        return doc;
                    }
                });
                if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
                    try {
                        yield temp.destroy();
                    }
                    catch (_a) { } // swallow any potential destroy error
                    throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`);
                }
                // destroy the source database
                yield source.destroy();
                let closeDestination = true;
                return yield this.doWork((destination) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const replicationResult = yield temp.replicate.to(destination);
                        if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
                            try {
                                closeDestination = false;
                                yield destination.destroy();
                            }
                            catch (_b) { } // swallow any potential destroy error
                            throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`);
                        }
                        return {
                            doc_count: replicationResult.docs_written,
                            loss_count: Math.abs(dbInfo.doc_count - replicationResult.docs_written)
                        };
                    }
                    catch (e) {
                        throw e;
                    }
                }), closeDestination);
            }), false);
        });
    }
    static asUntracked(...entities) {
        return entities.map(w => (Object.assign({}, w)));
    }
    static isProxy(entities) {
        return entities[DataContext.PROXY_MARKER] === true;
    }
    static isDate(value) {
        return Object.prototype.toString.call(value) === '[object Date]';
    }
    static merge(to, from, options) {
        for (let property in from) {
            if ((options === null || options === void 0 ? void 0 : options.skip) && options.skip.includes(property)) {
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
DataContext.PROXY_MARKER = '__isProxy';
exports.DataContext = DataContext;
//# sourceMappingURL=DataContext.js.map