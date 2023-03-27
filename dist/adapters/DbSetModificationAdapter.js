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
exports.DbSetModificationAdapter = void 0;
const DataContext_1 = require("../context/DataContext");
const DbSetBaseAdapter_1 = require("./DbSetBaseAdapter");
class DbSetModificationAdapter extends DbSetBaseAdapter_1.DbSetBaseAdapter {
    constructor(props, indexAdapter) {
        super(props);
        this.indexAdapter = indexAdapter;
    }
    processAddition(entity) {
        const addItem = entity;
        addItem.DocumentType = this.documentType;
        const id = this.getKeyFromEntity(entity);
        if (id != undefined) {
            addItem._id = id;
        }
        return addItem;
    }
    processAdditionAndMakeTrackable(entity) {
        const addItem = this.processAddition(entity);
        return this.api.makeTrackable(addItem, this.defaults.add, this.isReadonly, this.map);
    }
    instance(...entities) {
        return entities.map(entity => (Object.assign({}, this.processAdditionAndMakeTrackable(entity))));
    }
    add(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this.api.getTrackedData();
            const { add } = data;
            const result = entities.map(entity => {
                const indexableEntity = entity;
                if (indexableEntity["_rev"] !== undefined) {
                    throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity');
                }
                const trackableEntity = this.processAdditionAndMakeTrackable(entity);
                add.push(trackableEntity);
                return trackableEntity;
            });
            return result;
        });
    }
    upsert(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            // build the id's
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            const all = yield this.getAllData(getIndex);
            const allDictionary = all.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v })), {});
            const result = [];
            for (let entity of entities) {
                const instance = entity._id != null ? entity : Object.assign({}, this.processAdditionAndMakeTrackable(entity));
                const found = allDictionary[instance._id];
                if (found) {
                    const mergedAndTrackable = this.api.makeTrackable(found, this.defaults.add, this.isReadonly, this.map);
                    DataContext_1.DataContext.merge(mergedAndTrackable, entity, { skip: [this.api.PRISTINE_ENTITY_KEY] });
                    this.api.send([mergedAndTrackable]);
                    result.push(mergedAndTrackable);
                    continue;
                }
                const [added] = yield this.add(entity);
                result.push(added);
            }
            return result;
        });
    }
    remove(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.onRemove();
            if (entities.some(w => typeof w === "string")) {
                yield Promise.all(entities.map(w => this._removeById(w)));
                return;
            }
            yield Promise.all(entities.map(w => this._remove(w)));
        });
    }
    onRemove() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    empty() {
        return __awaiter(this, void 0, void 0, function* () {
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            const items = yield this._all(getIndex);
            yield this.remove(...items);
        });
    }
    _remove(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this.api.getTrackedData();
            const { remove } = data;
            const ids = remove.map(w => w._id);
            const indexableEntity = entity;
            if (ids.includes(indexableEntity._id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`);
            }
            remove.push(entity);
        });
    }
    _removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this.api.getTrackedData();
            const { removeById } = data;
            if (removeById.includes(id)) {
                throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`);
            }
            removeById.push(id);
        });
    }
}
exports.DbSetModificationAdapter = DbSetModificationAdapter;
//# sourceMappingURL=DbSetModificationAdapter.js.map