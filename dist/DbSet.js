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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSet = exports.PRISTINE_ENTITY_KEY = void 0;
const Validation_1 = require("./Validation");
const uuid_1 = require("uuid");
exports.PRISTINE_ENTITY_KEY = "__pristine_entity__";
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
class DbSet {
    /**
     * Constructor
     * @param documentType Type of Document this DbSet accepts
     * @param context Will be 'this' from the data context
     * @param idKeys Property(ies) that make up the primary key of the entity
     */
    constructor(documentType, context, defaults, ...idKeys) {
        this._events = {
            "add": [],
            "remove": []
        };
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys;
        this._defaults = defaults;
        this._api = this._context._getApi();
        const properties = Object.getOwnPropertyNames(DbSet.prototype).filter(w => w !== "IdKeys" && w !== "DocumentType");
        // Allow spread operator to work on the class for extending it
        for (let property of properties) {
            this[property] = this[property];
        }
    }
    get IdKeys() { return this._idKeys; }
    get DocumentType() { return this._documentType; }
    add(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { add } = data;
            return entities.map(entity => {
                const indexableEntity = entity;
                if (indexableEntity["_rev"] !== undefined) {
                    throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity');
                }
                const addItem = entity;
                addItem.DocumentType = this._documentType;
                const id = this._getKeyFromEntity(entity);
                if (id != undefined) {
                    const ids = add.map(w => w._id);
                    if (ids.includes(id)) {
                        throw new Error(`Cannot add entity with same id more than once.  _id: ${id}`);
                    }
                    addItem._id = id;
                }
                this._events["add"].forEach(w => w(entity));
                const trackableEntity = this._api.makeTrackable(addItem, this._defaults);
                add.push(trackableEntity);
                return trackableEntity;
            });
        });
    }
    _getKeyFromEntity(entity) {
        if (this._idKeys.length === 0) {
            return (0, uuid_1.v4)();
        }
        const indexableEntity = entity;
        const keyData = this._idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }
            const selector = w;
            return String(selector(entity));
        });
        return [this.DocumentType, ...keyData].join("/");
    }
    isMatch(first, second) {
        return this._getKeyFromEntity(first) === this._getKeyFromEntity(second);
    }
    remove(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entities.some(w => typeof w === "string")) {
                yield Promise.all(entities.map(w => this._removeById(w)));
                return;
            }
            yield Promise.all(entities.map(w => this._remove(w)));
        });
    }
    _remove(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { remove } = data;
            const ids = remove.map(w => w._id);
            const indexableEntity = entity;
            if (ids.includes(indexableEntity._id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`);
            }
            this._events["remove"].forEach(w => w(entity));
            remove.push(entity);
        });
    }
    empty() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this.all();
            yield this.remove(...items);
        });
    }
    _removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { removeById } = data;
            if (removeById.includes(id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`);
            }
            this._events["remove"].forEach(w => w(id));
            removeById.push(id);
        });
    }
    _detachItems(data) {
        return this._api.detach(data);
    }
    _all() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._api.getAllData(this._documentType);
            return data.map(w => this._api.makeTrackable(w, this._defaults));
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._all();
            this._api.send(result, false);
            return result;
        });
    }
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = [...data].filter(selector);
            this._api.send(result, false);
            return result;
        });
    }
    match(...items) {
        return items.filter(w => w.DocumentType === this.DocumentType);
    }
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this._api.get(...ids);
            if (entities.length > 0) {
                this._api.send(entities, false);
            }
            return entities;
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = [...data].find(selector);
            if (result) {
                this._api.send([result], false);
            }
            return result;
        });
    }
    detach(...entities) {
        this.unlink(...entities);
    }
    unlink(...entities) {
        const validationFailures = entities.map(w => (0, Validation_1.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n');
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`);
        }
        this._detachItems(entities);
    }
    link(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationFailures = entities.map(w => (0, Validation_1.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
            if (validationFailures.length > 0) {
                const errors = validationFailures.map(w => w.error).join('\r\n');
                throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`);
            }
            // Find the existing _rev just in case it's not in sync
            const found = yield this._api.get(...entities.map(w => w._id));
            if (found.length != entities.length) {
                throw new Error(`Error linking entities, document not found`);
            }
            const foundDictionary = found.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v._rev })), {});
            entities.forEach(w => {
                this._api.makeTrackable(w, this._defaults);
                w._rev = foundDictionary[w._id];
            });
            this._api.send(entities, true);
        });
    }
    attach(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.link(...entities);
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = data[0];
            if (result) {
                this._api.send([result], false);
            }
            return result;
        });
    }
    on(event, callback) {
        this._events[event].push(callback);
    }
}
exports.DbSet = DbSet;
//# sourceMappingURL=DbSet.js.map