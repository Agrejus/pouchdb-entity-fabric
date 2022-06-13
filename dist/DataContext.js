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
pouchdb_1.default.plugin(pouchdb_find_1.default);
class PouchDbBase {
    constructor(name, options) {
        this._options = options;
        this._name = name;
    }
    doWork(action, shouldClose = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = new pouchdb_1.default(this._name, this._options);
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
     * Get entity from the data store, this is used by DbSet
     * @param ids
     */
    get(...ids) {
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
     * Gets all data from the data store
     */
    getAllData(documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const findOptions = {
                    selector: {},
                };
                if (documentType != null) {
                    findOptions.selector.DocumentType = documentType;
                }
                const result = yield this.doWork(w => w.find(findOptions));
                return result.docs;
            }
            catch (e) {
                console.log(e);
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
        this._attachments = [];
        this._removeById = [];
        this._events = {
            "entity-created": [],
            "entity-removed": [],
            "entity-updated": []
        };
        this._dbSets = [];
        this._configuration = {};
    }
    getAllDocs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAllData();
        });
    }
    optimize() {
        return __awaiter(this, void 0, void 0, function* () {
            // once this index is created any read's will rebuild the index 
            // automatically.  The first read may be slow once new data is created
            yield this.doWork((w) => __awaiter(this, void 0, void 0, function* () {
                yield w.createIndex({
                    index: {
                        fields: ["DocumentType"],
                        name: 'autogen_document-type-index',
                        ddoc: "autogen_document-type-index"
                    },
                });
                yield w.createIndex({
                    index: {
                        fields: ["_deleted"],
                        name: 'autogen_deleted-index',
                        ddoc: "autogen_deleted-index"
                    },
                });
            }));
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
            get: this.get.bind(this)
        };
    }
    /**
     * Used by the context api
     * @param data
     */
    _detach(data) {
        this._attachments = this._attachments.filter(w => data.some(x => x._id === w._id) === false);
    }
    /**
     * Used by the context api
     * @param data
     */
    _sendData(data, shouldThrowOnDuplicate) {
        if (shouldThrowOnDuplicate) {
            const duplicate = this._attachments.find(w => data.some(x => x._id === w._id));
            if (duplicate) {
                throw new Error(`DataContext already contains item with the same id, cannot add more than once.  _id: ${duplicate._id}`);
            }
        }
        this._setAttachments(data);
    }
    _setAttachments(data) {
        // do not filter duplicates in case devs return multiple instances of the same entity
        this._attachments = [...this._attachments, ...data];
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
        for (let removal of removals) {
            const index = this._attachments.findIndex(w => w._id === removal._id);
            if (index !== -1) {
                this._attachments.splice(index, 1);
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
    _makeTrackable(entity) {
        const proxyHandler = {
            set: (entity, property, value) => {
                const indexableEntity = entity;
                const key = String(property);
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
            }
        };
        return new Proxy(entity, proxyHandler);
    }
    _getPendingChanges() {
        const { add, remove, removeById } = this._getTrackedData();
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
            updated
        };
    }
    _tryCallEvents(changes) {
        if (this._events["entity-removed"].length > 0 && changes.remove.length > 0) {
            changes.remove.forEach(w => this._events["entity-removed"].forEach(x => x(w)));
        }
        if (this._events["entity-created"].length > 0 && changes.add.length > 0) {
            changes.add.forEach(w => this._events["entity-created"].forEach(x => x(w)));
        }
        if (this._events["entity-updated"].length > 0 && changes.updated.length > 0) {
            changes.updated.forEach(w => this._events["entity-updated"].forEach(x => x(w)));
        }
    }
    _makePristine(entity) {
        const indexableEntity = entity;
        // make pristine again
        delete indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY];
    }
    _getModifications() {
        return __awaiter(this, void 0, void 0, function* () {
            const { add, remove, removeById, updated } = this._getPendingChanges();
            const extraRemovals = yield this.get(...removeById);
            return {
                add,
                remove: [...remove, ...extraRemovals].map(w => (Object.assign(Object.assign({}, w), { _deleted: true }))),
                updated
            };
        });
    }
    saveChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { add, remove, updated } = yield this._getModifications();
                const modifications = [...add, ...remove, ...updated];
                // remove pristine entity before we send to bulk docs
                modifications.forEach(w => this._makePristine(w));
                const modificationResult = yield this.bulkDocs(modifications);
                for (let modification of modifications) {
                    const found = modificationResult.successes[modification._id];
                    // update the rev in case we edit the record again
                    if (found && found.ok === true) {
                        const indexableEntity = modification;
                        indexableEntity._rev = found.rev;
                        // make pristine again because we set the _rev above
                        this._makePristine(modification);
                    }
                }
                // removals are being grouped with updates, 
                // need to separate out calls to events so we don't double dip
                // on updates and removals
                this._tryCallEvents({ remove, add, updated });
                this._reinitialize(remove, add);
                return modificationResult.successes_count;
            }
            catch (e) {
                this._reinitialize();
                throw e;
            }
        });
    }
    createDbSet(documentType, ...idKeys) {
        const dbSet = new DbSet_1.DbSet(documentType, this, ...idKeys);
        this._dbSets.push(dbSet);
        return dbSet;
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
    [Symbol.iterator]() {
        let index = -1;
        const data = this._dbSets;
        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}
exports.DataContext = DataContext;
//# sourceMappingURL=DataContext.js.map