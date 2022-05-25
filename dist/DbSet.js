"use strict";
/// <reference path="./DataContext.d.ts" />
/// <reference path="./DbSet.d.ts" />
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
    constructor(documentType, context, ...idKeys) {
        this._onBeforeAdd = null;
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys;
        this._api = this._context._getApi();
    }
    get IdKeys() { return this._idKeys; }
    get DocumentType() { return this._documentType; }
    /**
     * Attach an existing entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    attach(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { attach } = data;
            attach.push(entity);
        });
    }
    /**
     * Add an entity to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    add(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexableEntity = entity;
            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity');
            }
            const data = this._api.getTrackedData();
            const { add } = data;
            const addItem = entity;
            addItem.DocumentType = this._documentType;
            const id = this.getKeyFromEntity(entity);
            if (id != undefined) {
                const ids = add.map(w => w._id);
                if (ids.includes(id)) {
                    throw new Error(`Cannot add entity with same id more than once.  _id: ${id}`);
                }
                addItem._id = id;
            }
            if (this._onBeforeAdd != null) {
                this._onBeforeAdd(entity);
            }
            add.push(addItem);
        });
    }
    getKeyFromEntity(entity) {
        if (this._idKeys.length === 0) {
            return null;
        }
        const keyData = Object.keys(entity).filter((w) => this._idKeys.includes(w)).map(w => entity[w]);
        return [this.DocumentType, ...keyData].join("/");
    }
    isMatch(first, second) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }
    onBeforeAdd(action) {
        this._onBeforeAdd = action;
    }
    /**
     * Add array of entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entities
     */
    addRange(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(entities.map(w => this.add(w)));
        });
    }
    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    remove(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { remove } = data;
            const ids = remove.map(w => w._id);
            const indexableEntity = entity;
            if (ids.includes(indexableEntity._id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`);
            }
            remove.push(entity);
        });
    }
    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entity
     */
    removeRange(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(entities.map(w => this.remove(w)));
        });
    }
    /**
     * Remove all entities from underlying Data Context, saveChanges must be called to persist these items to the store
     */
    removeAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this.all();
            yield this.removeRange(items);
        });
    }
    /**
     * Remove entity from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param id
     */
    removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this._api.getTrackedData();
            const { removeById } = data;
            if (removeById.includes(id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`);
            }
            removeById.push(id);
        });
    }
    /**
     * Remove array of entities from underlying Data Context, saveChanges must be called to persist these items to the store
     * @param ids
     */
    removeRangeById(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(ids.map(w => this.removeById(w)));
        });
    }
    detachItems(data, matcher) {
        return this._api.detach(data, matcher);
    }
    makeTrackable(entity) {
        const proxyHandler = {
            set: (entity, property, value) => {
                const indexableEntity = entity;
                const key = String(property);
                const oldValue = indexableEntity[key];
                if (indexableEntity[exports.PRISTINE_ENTITY_KEY] === undefined) {
                    indexableEntity[exports.PRISTINE_ENTITY_KEY] = {};
                }
                if (indexableEntity[exports.PRISTINE_ENTITY_KEY][key] === undefined) {
                    indexableEntity[exports.PRISTINE_ENTITY_KEY][key] = oldValue;
                }
                indexableEntity[key] = value;
                return true;
            }
        };
        return new Proxy(entity, proxyHandler);
    }
    _all() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._api.getAllData(this._documentType);
            return data.map(w => this.makeTrackable(w));
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._all();
            this._api.send(result);
            return result;
        });
    }
    /**
     * Selects items from the data store, similar to Where in entity framework
     * @param selector
     * @returns Entity array
     */
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._all();
            const result = [...data].filter(selector);
            this._api.send(result);
            return result;
        });
    }
    /**
     * Matches items with the same document type
     * @param items
     * @returns Entity array
     */
    match(items) {
        return items.filter(w => w.DocumentType === this.DocumentType);
    }
    /**
     * Selects a matching entity from the data store or returns null
     * @param selector
     * @returns Entity
     */
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
    /**
     * Detaches specified array of items from the context
     * @param entities
     */
    detach(entities) {
        return this.detachItems(entities, this.isMatch.bind(this));
    }
}
exports.DbSet = DbSet;
//# sourceMappingURL=DbSet.js.map