"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterFactory = void 0;
const DbSetFetchAdapter_1 = require("./DbSetFetchAdapter");
const DbSetGeneralAdapter_1 = require("./DbSetGeneralAdapter");
const DbSetIndexAdapter_1 = require("./DbSetIndexAdapter");
const DbSetModificationAdapter_1 = require("./DbSetModificationAdapter");
const DbSetReferenceFetchAdapter_1 = require("./reference/DbSetReferenceFetchAdapter");
const DbSetReferenceModificationAdapter_1 = require("./reference/DbSetReferenceModificationAdapter");
class AdapterFactory {
    constructor(props) {
        this._props = props;
    }
    createFetchAdapter(indexAdapter) {
        if (this._props.splitDbSetOptions.enabled === true) {
            return new DbSetReferenceFetchAdapter_1.DbSetReferenceFetchAdapter(this._props, indexAdapter);
        }
        return new DbSetFetchAdapter_1.DbSetFetchAdapter(this._props, indexAdapter);
    }
    createGeneralAdapter() {
        return new DbSetGeneralAdapter_1.DbSetGeneralAdapter(this._props);
    }
    createIndexAdapter() {
        return new DbSetIndexAdapter_1.DbSetIndexAdapter(this._props);
    }
    createModificationAdapter(indexAdapter) {
        if (this._props.splitDbSetOptions.enabled === true) {
            return new DbSetReferenceModificationAdapter_1.DbSetReferenceModificationAdapter(this._props, indexAdapter);
        }
        return new DbSetModificationAdapter_1.DbSetModificationAdapter(this._props, indexAdapter);
    }
}
exports.AdapterFactory = AdapterFactory;
//# sourceMappingURL=AdapterFactory.js.map