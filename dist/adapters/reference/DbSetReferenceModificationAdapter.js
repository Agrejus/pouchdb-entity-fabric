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
exports.DbSetReferenceModificationAdapter = void 0;
const entity_types_1 = require("../../types/entity-types");
const DbSetModificationAdapter_1 = require("../DbSetModificationAdapter");
const uuid_1 = require("uuid");
const LinkedDatabase_1 = require("../../common/LinkedDatabase");
const AsyncCache_1 = require("../../cache/AsyncCache");
class DbSetReferenceModificationAdapter extends DbSetModificationAdapter_1.DbSetModificationAdapter {
    constructor(props, indexAdapter) {
        super(props, indexAdapter);
        this._asyncCache = new AsyncCache_1.AsyncCache();
    }
    get _getCacheKey() {
        return `${this.documentType}_TransactionId`;
    }
    _getTransactionId() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTransaction = yield this._asyncCache.get(this._getCacheKey);
            if (currentTransaction != null) {
                return currentTransaction.transactionId;
            }
            return yield this._createAndSaveTransactionId();
        });
    }
    _formatTransactionId(id) {
        return `${this.documentType}_PEF-REFERENCE_${id}`;
    }
    _createAndSaveTransactionId() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = (0, uuid_1.v4)();
            const newTransactionId = this._formatTransactionId(id);
            yield this._asyncCache.set({ _id: this._getCacheKey, transactionId: newTransactionId });
            return newTransactionId;
        });
    }
    endTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._asyncCache.remove(this._getCacheKey);
        });
    }
    startTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._asyncCache.set({ _id: this._getCacheKey, transactionId });
        });
    }
    get _getReferenceDocumentType() {
        return `${this.documentType}_REFERENCE`;
    }
    _createReferenceDocumentId() {
        const id = (0, uuid_1.v4)();
        return `${this._getReferenceDocumentType}/${id}`;
    }
    onRemove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.endTransaction();
        });
    }
    add(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            // Removing data should also end the current transaction, otherwise we might delete a db that has remove all of its data
            // We only need to start a new transaction if the current transaction has added data, we will need to increment this
            const currentTransaction = yield this._getTransactionId();
            const data = this.api.getTrackedData();
            const { add } = data;
            const result = entities.map(entity => {
                const indexableEntity = entity;
                if (indexableEntity["_rev"] !== undefined) {
                    throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity');
                }
                if (this.splitDbSetOptions.isManaged === true) {
                    if (!!indexableEntity[entity_types_1.SplitDocumentDocumentPropertyName]["_id"] || !!indexableEntity[entity_types_1.SplitDocumentDocumentPropertyName]["_rev"] || !!indexableEntity[entity_types_1.SplitDocumentDocumentPropertyName]["DocumentType"]) {
                        throw new Error('Reference entity cannot have an _id, _rev, or DocumentType when adding');
                    }
                }
                const processedEntity = this.processAddition(entity);
                if (this.splitDbSetOptions.isManaged === true) {
                    // attach id and document type to reference
                    processedEntity[entity_types_1.SplitDocumentDocumentPropertyName] = Object.assign(Object.assign({}, indexableEntity[entity_types_1.SplitDocumentDocumentPropertyName]), { _id: this._createReferenceDocumentId(), DocumentType: this._getReferenceDocumentType });
                    // create link to document
                    processedEntity[entity_types_1.SplitDocumentPathPropertyName] = (0, LinkedDatabase_1.createDocumentReference)(indexableEntity[entity_types_1.SplitDocumentDocumentPropertyName], currentTransaction);
                }
                const trackableEntity = this.api.makeTrackable(processedEntity, this.defaults.add, this.isReadonly, this.map);
                add.push(trackableEntity);
                return trackableEntity;
            });
            return result;
        });
    }
}
exports.DbSetReferenceModificationAdapter = DbSetReferenceModificationAdapter;
//# sourceMappingURL=DbSetReferenceModificationAdapter.js.map