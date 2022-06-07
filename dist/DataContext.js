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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataContext = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
const DbSet_1 = require("./DbSet");
const pouchdb_find_1 = __importDefault(require("pouchdb-find"));
pouchdb_1.default.plugin(pouchdb_find_1.default);
class DataContext {
    constructor(name, options) {
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
        this._db = new pouchdb_1.default(name, options);
    }
    /**
     * Gets all data from the data store
     */
    getAllData(documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const findOptions = {
                selector: {}
            };
            if (documentType != null) {
                findOptions.selector.DocumentType = documentType;
            }
            const result = yield this._db.find(findOptions);
            return result.docs;
        });
    }
    getAllDocs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAllData();
        });
    }
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    getContext() { return this; }
    /**
     * Inserts entity into the data store, this is used by DbSet
     * @param entity
     * @param onComplete
     */
    insertEntity(entity, onComplete) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._db.post(entity);
            const result = entity;
            result._rev = response.rev;
            if (!result._id) {
                result._id = response.id;
            }
            if (onComplete != null) {
                onComplete(result);
            }
            return response.ok;
        });
    }
    /**
     * Updates entity in the data store, this is used by DbSet
     * @param entity
     * @param onComplete
     */
    updateEntity(entity, onComplete) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this._db.put(entity);
                const result = entity;
                result._rev = response.rev;
                onComplete(result);
                return response.ok;
            }
            catch (_a) {
                const found = yield this.getEntity(entity._id);
                const result = entity;
                result._rev = found._id;
                const response = yield this._db.put(result);
                result._rev = response.rev;
                onComplete(result);
                return response.ok;
            }
        });
    }
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    bulkDocs(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._db.bulkDocs(entities);
            return response.map(w => {
                if ('error' in w) {
                    const error = w;
                    return {
                        id: error.id,
                        ok: false,
                        error: error.message,
                        rev: error.rev
                    };
                }
                const success = w;
                return {
                    id: success.id,
                    ok: success.ok,
                    rev: success.rev
                };
            });
        });
    }
    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity
     */
    removeEntity(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._db.remove(entity);
            return response.ok;
        });
    }
    /**
     * Remove entity in the data store, this is used by DbSet
     * @param id
     */
    removeEntityById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const entity = yield this._db.get(id);
            const response = yield this._db.remove(entity);
            this._events["entity-removed"].forEach(w => w(entity));
            return response.ok;
        });
    }
    /**
     * Get entity from the data store, this is used by DbSet
     * @param id
     */
    getEntity(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._db.get(id);
            }
            catch (e) {
                return null;
            }
        });
    }
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
            makeTrackable: this._makeTrackable.bind(this)
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
    reinitialize(removals = [], removalsById = [], add = []) {
        this._additions = [];
        this._removals = [];
        this._removeById = [];
        // remove attached tracking changes
        for (let item of this._attachments) {
            const indexableEntity = item;
            delete indexableEntity[DbSet_1.PRISTINE_ENTITY_KEY];
        }
        for (let removal of removals) {
            const index = this._attachments.findIndex(w => w._id === removal._id);
            if (index !== -1) {
                this._attachments.splice(index, 1);
            }
        }
        for (let removalById of removalsById) {
            const index = this._attachments.findIndex(w => w._id === removalById);
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
    saveChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { add, remove, removeById, updated } = this._getPendingChanges();
                // remove pristine entity
                [...add, ...remove, ...updated].forEach(w => this._makePristine(w));
                const addsWithIds = add.filter(w => !!w._id);
                const addsWithoutIds = add.filter(w => w._id == null);
                const modifications = [...updated, ...addsWithIds, ...remove.map(w => (Object.assign(Object.assign({}, w), { _deleted: true })))];
                const modificationResult = yield this.bulkDocs(modifications);
                const successfulModifications = modificationResult.filter(w => w.ok === true);
                for (let modification of modifications) {
                    const found = successfulModifications.find(w => w.id === modification._id);
                    // update the rev in case we edit the record again
                    if (found && found.ok === true) {
                        const indexableEntity = modification;
                        indexableEntity._rev = found.rev;
                        // make pristine again
                        this._makePristine(modification);
                    }
                }
                const additionsWithGeneratedIds = yield Promise.all(addsWithoutIds.map(w => this.addEntityWithoutId(w)));
                const removalsById = yield Promise.all(removeById.map(w => this.removeEntityById(w)));
                // removals are being grouped with updates, 
                // need to separate out calls to events so we don't double dip
                // on updates and removals
                this._tryCallEvents({ remove, add, updated });
                this.reinitialize(remove, removeById, add);
                return [...removalsById, ...additionsWithGeneratedIds, ...modificationResult.map(w => {
                        return w.ok;
                    })].filter(w => w === true).length;
            }
            catch (e) {
                this.reinitialize();
                throw e;
            }
        });
    }
    addEntityWithoutId(entity) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.insertEntity(entity);
                resolve({ ok: result, id: "", rev: "" });
            }
            catch (e) {
                console.error(e);
                reject({ ok: false, id: "", rev: "" });
            }
        }));
    }
    createDbSet(documentType, ...idKeys) {
        const dbSet = new DbSet_1.DbSet(documentType, this, ...idKeys);
        this._dbSets.push(dbSet);
        return dbSet;
    }
    query(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield callback(this._db);
        });
    }
    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }
    on(event, callback) {
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
exports.DataContext = DataContext;
//# sourceMappingURL=DataContext.js.map