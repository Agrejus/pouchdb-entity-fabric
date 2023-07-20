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
exports.DbSetBaseAdapter = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
const pouchdb_find_1 = __importDefault(require("pouchdb-find"));
pouchdb_1.default.plugin(pouchdb_find_1.default);
const uuid_1 = require("uuid");
class DbSetBaseAdapter {
    constructor(props) {
        this.documentType = props.documentType;
        this.context = props.context;
        this.idKeys = props.idKeys;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.keyType = props.keyType;
        this.map = props.map;
        this.splitDbSetOptions = props.splitDbSetOptions;
        this.filterSelector = props.filterSelector;
        this.api = this.context._getApi();
    }
    allDataAndMakeTrackable(getIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getAllData(getIndex);
            // process the mappings when we make the item trackable.  We are essentially prepping the entity
            const result = data.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map));
            return this.filterResult(result);
        });
    }
    onAfterDataFetched(data) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    deconstructQuery(query, result) {
        // we are finding the outter occurrences and working inward
        let start = query.indexOf("(");
        let end = query.lastIndexOf(")");
        const test = {};
        let left = query.substring(start, query.length);
        let right = query.substring(0, start);
        test.left = left;
        test.right = right;
        test.operator = right.split(' ').find(w => w === "&&" || w === "||");
        start = test.left.indexOf("(");
        end = test.left.lastIndexOf(")");
        left = test.left.substring(start, end);
        right = test.left.substring(end + 1, test.left.length);
    }
    convertFilterSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            // try {
            //     const stringifiedSelector = selector.toString();
            //     const [variable, selectorFunction] = stringifiedSelector.split('=>').map(w => w.trim());
            //     const r: any = {};
            //     this.deconstructQuery(selectorFunction, r)
            //     // find the first match, replace it with a group number, try and get all parent splits and go from there
            //     // \(.{1,}?\)
            //     /*
            //     Test Data
            //     w._id === "" && (w.DocumentType === DocumentTypes.Books || w.author === "James" || (w.status === "approved" || w.author === "Megan")) && (w.DocumentType === DocumentTypes.Books || w.author === "James")
            //         OR
            //     id === 1 && test == 2 && (test === 3) && (win === 1)
            //     */
            //     const testSplit = selectorFunction.split(/()|()/g)
            //     const cleanse = selectorFunction.replace(/\s+/g, ' ').replace(/\r/g, '').replace(/\n/g, '').replace(/\t/g, ' ')
            //     const matches = cleanse.match(/\(.{1,}\)/g);
            //     let result = cleanse;
            //     for (let i = 0; i < result.length; i++) {
            //         const match = matches[i];
            //         result = result.replace(match, `__MATCH-${i}__`)
            //     }
            //     console.log(result);
            //     //w => w._id === "" && (w.DocumentType === DocumentTypes.Books || w.author === "James")
            //     // selector: {
            //     //     $and: [
            //     //         { rejectedCount: 1 },
            //     //         {
            //     //             $or: [
            //     //                 { DocumentType: { $eq: "Books" } },
            //     //                 { author: { $eq: "James" } }
            //     //             ]
            //     //         }
            //     //     ]
            //     // }
            //     //console.log(test)
            // } catch (e: any) {
            //     console.error(e);
            // }
        });
    }
    _all(getIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.allDataAndMakeTrackable(getIndex);
            yield this.onAfterDataFetched(result);
            this.api.send(result);
            return this.filterResult(result);
        });
    }
    filterResult(result) {
        if (this.filterSelector == null) {
            return result;
        }
        return result.filter(w => this.filterSelector(w));
    }
    getAllData(getIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = getIndex();
            return yield this.api.getAllData({
                documentType: this.documentType,
                index
            });
        });
    }
    getKeyFromEntity(entity) {
        if (this.keyType === 'auto') {
            return (0, uuid_1.v4)();
        }
        if (this.keyType === 'none') {
            return this.documentType;
        }
        // user defined key
        const indexableEntity = entity;
        const keyData = this.idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }
            const selector = w;
            return String(selector(entity));
        });
        return [this.documentType, ...keyData].filter(w => !!w).join("/");
    }
}
exports.DbSetBaseAdapter = DbSetBaseAdapter;
//# sourceMappingURL=DbSetBaseAdapter.js.map