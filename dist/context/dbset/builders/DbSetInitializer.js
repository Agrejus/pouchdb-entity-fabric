"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetInitializer = void 0;
const DefaultDbSetBuilder_1 = require("./DefaultDbSetBuilder");
const SplitDbSetBuilder_1 = require("./SplitDbSetBuilder");
class DbSetInitializer {
    constructor(onAddDbSet, context) {
        this._onAddDbSet = onAddDbSet;
        this._context = context;
    }
    default(documentType) {
        return new DefaultDbSetBuilder_1.DefaultDbSetBuilder(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: false,
                isManaged: false
            }
        });
    }
    split(documentType) {
        return new SplitDbSetBuilder_1.SplitDbSetBuilder(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: true
            }
        });
    }
    unmanagedSplit(documentType) {
        return new SplitDbSetBuilder_1.SplitDbSetBuilder(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: false
            }
        });
    }
}
exports.DbSetInitializer = DbSetInitializer;
//# sourceMappingURL=DbSetInitializer.js.map