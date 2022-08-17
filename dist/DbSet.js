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
     * @param props Properties for the constructor
     */
    constructor(props) {
        this._events = {
            "add": [],
            "remove": []
        };
        this._asyncEvents = {
            "add-invoked": [],
            "remove-invoked": []
        };
        this._documentType = props.documentType;
        this._context = props.context;
        this._idKeys = props.idKeys;
        this._defaults = props.defaults;
        this._isReadonly = props.readonly;
        this._keyType = props.keyType;
        this._events = props.events;
        this._asyncEvents = props.asyncEvents;
        this._map = props.map;
        this._api = this._context._getApi();
        const properties = Object.getOwnPropertyNames(DbSet.prototype).filter(w => w !== "IdKeys" && w !== "DocumentType");
        // Allow spread operator to work on the class for extending it - Deprecated
        for (let property of properties) {
            this[property] = this[property];
        }
    }
    /**
     * Get the IdKeys for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get IdKeys() { return this._idKeys; }
    /**
     * Get the Document Type for the DbSet
     * @deprecated Use {@link info()} instead.
     */
    get DocumentType() { return this._documentType; }
    info() {
        const info = {
            DocumentType: this._documentType,
            IdKeys: this._idKeys,
            Defaults: this._defaults,
            KeyType: this._keyType,
            Readonly: this._isReadonly,
            Map: this._map
        };
        return info;
    }
    instance(...entities) {
        return entities.map(entity => {
            const addItem = entity;
            addItem.DocumentType = this._documentType;
            const id = this._getKeyFromEntity(entity);
            if (id != undefined) {
                addItem._id = id;
            }
            const trackableEntity = this._api.makeTrackable(addItem, this._defaults.add, this._isReadonly, this._map);
            return Object.assign({}, trackableEntity);
        });
    }
    add(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { add } = data;
            const result = entities.map(entity => {
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
                const trackableEntity = this._api.makeTrackable(addItem, this._defaults.add, this._isReadonly, this._map);
                add.push(trackableEntity);
                return trackableEntity;
            });
            if (this._asyncEvents['add-invoked'].length > 0) {
                yield Promise.all(this._asyncEvents['add-invoked'].map(w => w(result)));
            }
            return result;
        });
    }
    _getKeyFromEntity(entity) {
        if (this._keyType === 'auto') {
            return (0, uuid_1.v4)();
        }
        if (this._keyType === 'none') {
            return this._documentType;
        }
        // user defined key
        const indexableEntity = entity;
        const keyData = this._idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }
            const selector = w;
            return String(selector(entity));
        });
        return [this._documentType, ...keyData].join("/");
    }
    isMatch(first, second) {
        return this._getKeyFromEntity(first) === this._getKeyFromEntity(second);
    }
    remove(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._asyncEvents['remove-invoked'].length > 0) {
                yield Promise.all(this._asyncEvents['remove-invoked'].map(w => w(entities)));
            }
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
            // process the mappings when we make the item trackable.  We are essentially prepping the entity
            return data.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map));
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
        return items.filter(w => w.DocumentType === this._documentType);
    }
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this._api.get(...ids);
            const result = entities.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map));
            if (result.length > 0) {
                this._api.send(result, false);
            }
            return result;
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
            const result = entities.map(w => {
                const entity = this._api.makeTrackable(w, this._defaults.add, this._isReadonly, this._map);
                entity._rev = foundDictionary[w._id];
                return entity;
            });
            this._api.send(result, true);
            return result;
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
        if (event === 'add-invoked' || event === "remove-invoked") {
            this._asyncEvents[event].push(callback);
            return;
        }
        this._events[event].push(callback);
    }
}
exports.DbSet = DbSet;
//# sourceMappingURL=DbSet.js.map