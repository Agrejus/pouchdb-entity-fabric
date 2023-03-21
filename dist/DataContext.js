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
const DbSet_1 = require("./DbSet");
const pouchdb_find_1 = __importDefault(require("pouchdb-find"));
const pouchdb_adapter_memory_1 = __importDefault(require("pouchdb-adapter-memory"));
const AdvancedDictionary_1 = require("./AdvancedDictionary");
const DbSetBuilder_1 = require("./DbSetBuilder");
const IndexApi_1 = require("./IndexApi");
pouchdb_1.default.plugin(pouchdb_find_1.default);
pouchdb_1.default.plugin(pouchdb_adapter_memory_1.default);
var CacheKeys;
(function (CacheKeys) {
    CacheKeys["IsOptimized"] = "IsOptimized";
})(CacheKeys || (CacheKeys = {}));
class ContextCache {
    constructor() {
        this._data = {};
    }
    upsert(key, value) {
        this._data[key] = value;
    }
    remove(key) {
        delete this._data[key];
    }
    get(key) {
        return this._data[key];
    }
    contains(key) {
        return this._data[key] != null;
    }
}
const cache = new ContextCache();
class PouchDbBase {
    constructor(name, options) {
        this._dbOptions = options;
        this._dbName = name;
    }
    createDb() {
        return new pouchdb_1.default(this._dbName, this._dbOptions);
    }
    doWork(action, shouldClose = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.createDb();
            const result = yield action(db);
            if (shouldClose) {
                yield db.close();
            }
            return result;
        });
    }
}
class PouchDbInteractionBase extends PouchDbBase {
    constructor(name, options) {
        super(name, options);
    }
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    bulkDocs(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.doWork(w => w.bulkDocs(entities));
            const result = {
                errors: {},
                successes: {},
                errors_count: 0,
                successes_count: 0
            };
            for (let item of response) {
                if ('error' in item) {
                    const error = item;
                    result.errors_count += 1;
                    result.errors[error.id] = {
                        id: error.id,
                        ok: false,
                        error: error.message,
                        rev: error.rev
                    };
                    continue;
                }
                const success = item;
                result.successes_count += 1;
                result.successes[success.id] = {
                    id: success.id,
                    ok: success.ok,
                    rev: success.rev
                };
            }
            return result;
        });
    }
    /**
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids
     */
    getStrict(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ids.length === 0) {
                return [];
            }
            const result = yield this.doWork(w => w.bulkGet({ docs: ids.map(x => ({ id: x })) }));
            return result.results.map(w => {
                const result = w.docs[0];
                if ('error' in result) {
                    throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`);
                }
                return result.ok;
            });
        });
    }
    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids
     */
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.doWork(w => w.find({
                    selector: {
                        _id: {
                            $in: ids
                        }
                    }
                }), false);
                return result.docs;
            }
            catch (e) {
                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }
                return [];
            }
        });
    }
    /**
     * Gets all data from the data store
     */
    getAllData(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const findOptions = {
                    selector: {},
                };
                if ((payload === null || payload === void 0 ? void 0 : payload.documentType) != null) {
                    findOptions.selector.DocumentType = payload.documentType;
                }
                if ((payload === null || payload === void 0 ? void 0 : payload.index) != null) {
                    findOptions.use_index = payload.index;
                }
                const result = yield this.doWork(w => w.find(findOptions));
                return result.docs;
            }
            catch (e) {
                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }
                return [];
            }
        });
    }
}
class DataContext extends PouchDbInteractionBase {
    constructor(name, options) {
        const pouchDb = __rest(options !== null && options !== void 0 ? options : {}, []);
        super(name, pouchDb);
        this._removals = [];
        this._additions = [];
        this._attachments = new AdvancedDictionary_1.AdvancedDictionary("_id");
        this._purges = [];
        this._removeById = [];
        this._events = {
            "entity-created": [],
            "entity-removed": [],
            "entity-updated": []
        };
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
            cache.upsert(CacheKeys.IsOptimized, true);
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
            map: this._map.bind(this)
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
            removeById: this._removeById,
            purge: this._purges
        };
    }
    _reinitialize(removals = [], add = []) {
        this._additions = [];
        this._removals = [];
        this._removeById = [];
        this._purges = [];
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
                if (property === DbSet_1.DIRTY_ENTITY_MARKER) {
                    if (indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY] = {};
                    }
                    indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY][DbSet_1.DIRTY_ENTITY_MARKER] = true;
                    return true;
                }
                if (property !== DbSet_1.PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];
                    if (indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY] = {};
                    }
                    if (indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY][key] = oldValue;
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
        const { add, remove, removeById, purge } = this._getTrackedData();
        const updated = this._attachments.filter(w => {
            const indexableEntity = w;
            if (indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY] === undefined) {
                return false;
            }
            const pristineKeys = Object.keys(indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY]);
            for (let pristineKey of pristineKeys) {
                if (indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                    return true;
                }
            }
            return false;
        });
        return {
            add,
            remove,
            removeById,
            updated,
            purge
        };
    }
    previewChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const { add, remove, updated, purge } = yield this._getModifications();
            const clone = JSON.stringify({
                add,
                remove,
                update: updated,
                purge
            });
            return JSON.parse(clone);
        });
    }
    _tryCallPostSaveEvents(changes) {
        this._callEvents(changes.remove, "entity-removed");
        this._callEvents(changes.add, "entity-created");
        this._callEvents(changes.updated, "entity-updated");
    }
    _callEvents(data, entityEvent) {
        if (data.length > 0) {
            if (this._events[entityEvent].length > 0) {
                data.forEach(w => this._events[entityEvent].forEach(x => x(w)));
            }
        }
    }
    _makePristine(...entities) {
        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i];
            // make pristine again
            delete indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY];
        }
    }
    _getModifications() {
        return __awaiter(this, void 0, void 0, function* () {
            const { add, remove, removeById, updated, purge } = this._getPendingChanges();
            const extraRemovals = yield this.getStrict(...removeById);
            return {
                add,
                remove: [...remove, ...extraRemovals].map(w => ({ _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true })),
                updated,
                purge
            };
        });
    }
    _purgeDocument(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.doWork((w) => __awaiter(this, void 0, void 0, function* () { return yield w.purge(document._id, document._rev); }));
            return result.ok === true && result.documentWasRemovedCompletely === true;
        });
    }
    saveChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { add, remove, updated, purge } = yield this._getModifications();
                // Process removals first, so we can remove items first and then add.  Just
                // in case are are trying to remove and add the same Id
                const modifications = [...remove, ...add, ...updated];
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
                const purges = [];
                if (purge.length > 0) {
                    const result = yield Promise.all(purge.map((w) => __awaiter(this, void 0, void 0, function* () { return this._purgeDocument(w); })));
                    purges.push(...result.filter(w => w === true));
                }
                // removals are being grouped with updates, 
                // need to separate out calls to events so we don't double dip
                // on updates and removals
                this._tryCallPostSaveEvents({ remove, add, updated });
                this._reinitialize([...remove, ...purge], add);
                return modificationResult.successes_count + purges.length;
            }
            catch (e) {
                this._reinitialize();
                throw e;
            }
        });
    }
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns DbSetBuilder
     */
    dbset(documentType) {
        return new DbSetBuilder_1.DbSetBuilder(this._addDbSet.bind(this), {
            documentType,
            context: this,
            readonly: false
        });
    }
    query(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.doWork(w => callback(w));
        });
    }
    hasPendingChanges() {
        const { add, remove, removeById, updated, purge } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length, purge.length].some(w => w > 0);
    }
    on(event, callback) {
        this._events[event].push(callback);
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
exports.DataContext = DataContext;
DataContext.PROXY_MARKER = '__isProxy';
//# sourceMappingURL=DataContext.js.map