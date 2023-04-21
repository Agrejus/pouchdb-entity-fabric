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
exports.ExperimentalDataContext = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
const LinkedDatabase_1 = require("../common/LinkedDatabase");
const entity_types_1 = require("../types/entity-types");
const DataContext_1 = require("./DataContext");
const ExperimentalDbSetInitializer_1 = require("./dbset/builders/ExperimentalDbSetInitializer");
const DatabaseStoreFactory_1 = require("../store/DatabaseStoreFactory");
class ExperimentalDataContext extends DataContext_1.DataContext {
    constructor(name, options) {
        super(name, options);
        this._hasSplitDbSet = null;
        this._remappings = {};
        this._referencesToAddBack = {};
        this._databaseStore = DatabaseStoreFactory_1.DatabaseStoreFactory.getDataStore(this.asyncCache);
    }
    _validateSplitDocuments() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedDatabaseNames = yield this._databaseStore.getDatabaseNames();
            const list = [];
            for (const dbName of cachedDatabaseNames) {
                try {
                    const wasDestroyed = yield this._tryDestroyDatabase(new pouchdb_1.default(dbName));
                    if (wasDestroyed === false) {
                        const allDocs = yield this.query({
                            selector: {
                                referencePath: { $regex: new RegExp(dbName, "g") }
                            },
                            fields: ["_id"]
                        });
                        // check for orphaned docs
                        if (allDocs.docs.length === 0) {
                            const db = new pouchdb_1.default(dbName);
                            yield db.destroy();
                            continue;
                        }
                        // contains data
                        list.push(dbName);
                    }
                }
                catch (_a) {
                    // swallow
                }
            }
            yield this._databaseStore.upsertDatabaseName(...list);
        });
    }
    _tryDestroyDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield db.allDocs({ include_docs: false });
            if (all.rows.length === 0) {
                this;
                yield db.destroy();
                return true;
            }
            return false;
        });
    }
    _getHasSplitDbSet() {
        if (this._hasSplitDbSet != null) {
            return this._hasSplitDbSet;
        }
        for (const dbset of this) {
            if (dbset.info().SplitDbSetOptions.enabled === true) {
                this._hasSplitDbSet = true;
                return true;
            }
        }
        this._hasSplitDbSet = false;
        return false;
    }
    onAfterSetRev(indexableEntity) {
        var _a, _b;
        // Remap Reference because we deleted it on save
        if (this._remappings[indexableEntity._id]) {
            const dbSet = this.dbSets[indexableEntity.DocumentType];
            // only add back on save if its managed
            if (dbSet.info().SplitDbSetOptions.isManaged === true) {
                this._remappings[indexableEntity._id].parent.reference = this._remappings[indexableEntity._id].reference;
            }
            if (this._referencesToAddBack[(_a = this._remappings[indexableEntity._id].reference) === null || _a === void 0 ? void 0 : _a._id]) {
                this._remappings[indexableEntity._id].parent.reference = this._referencesToAddBack[(_b = this._remappings[indexableEntity._id].reference) === null || _b === void 0 ? void 0 : _b._id];
            }
        }
    }
    onBeforeSaveChanges(modifications) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this._getHasSplitDbSet() === true) {
                const referenceModifications = {};
                if (modifications.length > 0) {
                    // keep the path and tear off the references
                    for (const item of modifications) {
                        const dbSet = this.dbSets[item.DocumentType];
                        if (dbSet.info().SplitDbSetOptions.enabled === false) {
                            // Skip changes on disabled db sets
                            continue;
                        }
                        const castedItem = item;
                        const document = ((_a = castedItem[entity_types_1.SplitDocumentDocumentPropertyName]) !== null && _a !== void 0 ? _a : {});
                        const referencePath = castedItem[entity_types_1.SplitDocumentPathPropertyName];
                        this._remappings[item._id] = { parent: item, reference: document };
                        const reference = (0, LinkedDatabase_1.parseDocumentReference)(referencePath);
                        if (reference == null) {
                            continue;
                        }
                        if (document._id == null) {
                            document._id = reference.selector.value;
                        }
                        if (dbSet.info().SplitDbSetOptions.isManaged === false) {
                            // Skip changes on dbset if unmanaged
                            this._referencesToAddBack[document._id] = castedItem[entity_types_1.SplitDocumentDocumentPropertyName];
                            delete castedItem[entity_types_1.SplitDocumentDocumentPropertyName];
                            continue;
                        }
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
                const cachedDatabaseNames = yield this._databaseStore.getDatabaseNames();
                const dbList = new Set(cachedDatabaseNames);
                for (const group in referenceModifications) {
                    try {
                        const documents = referenceModifications[group].documents;
                        const referenceDb = new pouchdb_1.default(group);
                        dbList.add(group);
                        const deletions = documents.filter(w => '_deleted' in w && w._deleted === true);
                        const upserts = documents.filter(w => ('_deleted' in w) === false);
                        const readyDeletions = deletions.filter(w => w._rev != null);
                        const deletionsWithNoRev = deletions.filter(w => w._rev == null);
                        if (deletionsWithNoRev.length > 0) {
                            const resolvedDocuments = yield referenceDb.find({
                                selector: {
                                    _id: { $in: documents.filter(w => w._rev == null).map(w => w._id) }
                                },
                                fields: ["_id", "_rev"]
                            });
                            const resovledDeletions = resolvedDocuments.docs.map(w => (Object.assign(Object.assign({}, w), { _deleted: true })));
                            readyDeletions.push(...resovledDeletions);
                        }
                        const referenceBulkDocsResponse = yield referenceDb.bulkDocs([...upserts, ...readyDeletions]);
                        const referenceModificationResult = this.formatBulkDocsResponse(referenceBulkDocsResponse);
                        for (let i = 0; i < documents.length; i++) {
                            const document = documents[i];
                            const referenceToAddBack = this._referencesToAddBack[document._id];
                            if (referenceToAddBack != null) {
                                document[entity_types_1.SplitDocumentDocumentPropertyName] = referenceToAddBack;
                            }
                            const found = referenceModificationResult.successes[document._id];
                            // update the rev in case we edit the record again
                            if (found && found.ok === true) {
                                const indexableEntity = document;
                                indexableEntity._rev = found.rev;
                            }
                        }
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
                this._databaseStore.upsertDatabaseName(...dbList);
            }
        });
    }
    onAfterSaveChanges(modifications) {
        return __awaiter(this, void 0, void 0, function* () {
            this._remappings = {};
            this._referencesToAddBack = {};
            yield this._validateSplitDocuments();
        });
    }
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @returns {DbSetInitializer}
     */
    experimentalDbset() {
        return new ExperimentalDbSetInitializer_1.ExperimentalDbSetInitializer(this.addDbSet.bind(this), this);
    }
}
exports.ExperimentalDataContext = ExperimentalDataContext;
//# sourceMappingURL=ExperimentalDataContext.js.map