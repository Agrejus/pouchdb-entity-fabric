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
exports.DbSetReferenceFetchAdapter = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
const entity_types_1 = require("../../types/entity-types");
const DbSetFetchAdapter_1 = require("../DbSetFetchAdapter");
const LinkedDatabase_1 = require("../../common/LinkedDatabase");
class DbSetReferenceFetchAdapter extends DbSetFetchAdapter_1.DbSetFetchAdapter {
    constructor(props, indexAdapter) {
        super(props, indexAdapter);
    }
    _getMany(databaseName, ...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const database = new pouchdb_1.default(databaseName);
            const response = yield database.find({
                selector: { _id: { $in: ids } }
            });
            return response.docs;
        });
    }
    onAfterDataFetched(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentsWithReferences = data.filter(w => !!w[entity_types_1.SplitDocumentPathPropertyName]);
            const documentReferenceMap = {};
            const referenceModifications = {};
            const referenceIdToMainIdLinks = {};
            for (const entity of documentsWithReferences) {
                const castedItem = entity;
                const referencePath = castedItem[entity_types_1.SplitDocumentPathPropertyName];
                const reference = (0, LinkedDatabase_1.parseDocumentReference)(referencePath);
                if (referenceModifications[reference.databaseName] == null) {
                    referenceModifications[reference.databaseName] = [];
                }
                referenceModifications[reference.databaseName].push(reference.selector.value);
                documentReferenceMap[entity._id] = reference;
                referenceIdToMainIdLinks[reference.selector.value] = entity;
            }
            const mods = [];
            for (const referenceModification in referenceModifications) {
                mods.push({ databaseName: referenceModification, ids: referenceModifications[referenceModification] });
            }
            const referencedDocuments = yield Promise.all(mods.map(w => this._getMany(w.databaseName, ...w.ids)));
            for (const referencedDocument of referencedDocuments.reduce((a, v) => a.concat(v), [])) {
                referenceIdToMainIdLinks[referencedDocument._id].reference = referencedDocument;
                this.api.makePristine(referenceIdToMainIdLinks[referencedDocument._id]);
            }
        });
    }
}
exports.DbSetReferenceFetchAdapter = DbSetReferenceFetchAdapter;
//# sourceMappingURL=DbSetReferenceFetchAdapter.js.map