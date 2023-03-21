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
exports.DbSet = exports.DIRTY_ENTITY_MARKER = exports.PRISTINE_ENTITY_KEY = void 0;
const Validation_1 = require("./Validation");
const uuid_1 = require("uuid");
const DataContext_1 = require("./DataContext");
exports.PRISTINE_ENTITY_KEY = "__pristine_entity__";
exports.DIRTY_ENTITY_MARKER = "__isDirty";
class IndexStore {
    constructor(defaultName) {
        this._default = null;
        this._once = null;
        this._default = defaultName;
    }
    once(name) {
        this._once = name;
    }
    get() {
        if (this._once) {
            const result = this._once;
            this._once = null;
            return result;
        }
        return this._default;
    }
}
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
        this._indexStore = new IndexStore(props.index);
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
    _processAddition(entity) {
        const addItem = entity;
        addItem.DocumentType = this._documentType;
        const id = this._getKeyFromEntity(entity);
        if (id != undefined) {
            addItem._id = id;
        }
        if (this._events["add"].length > 0) {
            this._events["add"].forEach(w => w(entity));
        }
        return this._api.makeTrackable(addItem, this._defaults.add, this._isReadonly, this._map);
    }
    instance(...entities) {
        return entities.map(entity => (Object.assign({}, this._processAddition(entity))));
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
                const trackableEntity = this._processAddition(entity);
                add.push(trackableEntity);
                return trackableEntity;
            });
            if (this._asyncEvents['add-invoked'].length > 0) {
                yield Promise.all(this._asyncEvents['add-invoked'].map(w => w(result)));
            }
            return result;
        });
    }
    _merge(from, to) {
        var _a;
        return Object.assign(Object.assign(Object.assign({}, from), to), { [exports.PRISTINE_ENTITY_KEY]: Object.assign(Object.assign({}, from), ((_a = to[exports.PRISTINE_ENTITY_KEY]) !== null && _a !== void 0 ? _a : {})), _rev: from._rev });
    }
    _getAllData() {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this._indexStore.get();
            return yield this._api.getAllData({
                documentType: this._documentType,
                index
            });
        });
    }
    upsert(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            // build the id's
            const all = yield this._getAllData();
            const allDictionary = all.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v })), {});
            const result = [];
            for (let entity of entities) {
                const instance = entity._id != null ? entity : Object.assign({}, this._processAddition(entity));
                const found = allDictionary[instance._id];
                if (found) {
                    const mergedAndTrackable = this._api.makeTrackable(found, this._defaults.add, this._isReadonly, this._map);
                    DataContext_1.DataContext.merge(mergedAndTrackable, entity, { skip: [exports.PRISTINE_ENTITY_KEY] });
                    this._api.send([mergedAndTrackable]);
                    result.push(mergedAndTrackable);
                    continue;
                }
                const [added] = yield this.add(entity);
                result.push(added);
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
    purge(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            entities.forEach(w => this._purge(w));
        });
    }
    _purge(entity) {
        const data = this._api.getTrackedData();
        const { purge } = data;
        const ids = purge.map(w => w._id);
        const indexableEntity = entity;
        if (ids.includes(indexableEntity._id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`);
        }
        purge.push(entity);
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
    useIndex(name) {
        this._indexStore.once(name);
        return this;
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
            const data = yield this._getAllData();
            // process the mappings when we make the item trackable.  We are essentially prepping the entity
            return data.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map));
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._all();
            this._api.send(result);
            return result;
        });
    }
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = [...data].filter(selector);
            this._api.send(result);
            return result;
        });
    }
    match(...items) {
        return items.filter(w => w.DocumentType === this._documentType);
    }
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this._api.getStrict(...ids);
            const result = entities.map(w => this._api.makeTrackable(w, this._defaults.retrieve, this._isReadonly, this._map));
            if (result.length > 0) {
                this._api.send(result);
            }
            return result;
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = [...data].find(selector);
            if (result) {
                this._api.send([result]);
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
    markDirty(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entities.some(w => DataContext_1.DataContext.isProxy(w) === false)) {
                throw new Error(`Entities must be linked to context in order to mark as dirty`);
            }
            return entities.map(w => {
                w[exports.DIRTY_ENTITY_MARKER] = true;
                return w;
            });
        });
    }
    link(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationFailures = entities.map(w => (0, Validation_1.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
            if (validationFailures.length > 0) {
                const errors = validationFailures.map(w => w.error).join('\r\n');
                throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`);
            }
            // Find the existing _rev just in case it's not in sync
            const found = yield this._api.getStrict(...entities.map(w => w._id));
            const foundDictionary = found.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v._rev })), {});
            const result = entities.map(w => this._api.makeTrackable(Object.assign(Object.assign({}, w), { _rev: foundDictionary[w._id] }), this._defaults.add, this._isReadonly, this._map));
            this._api.send(result);
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
                this._api.send([result]);
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