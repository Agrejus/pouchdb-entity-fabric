"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalDbSetInitializer = void 0;
const DbSetInitializer_1 = require("./DbSetInitializer");
const SplitDbSetBuilder_1 = require("./SplitDbSetBuilder");
class ExperimentalDbSetInitializer extends DbSetInitializer_1.DbSetInitializer {
    constructor(onAddDbSet, context) {
        super(onAddDbSet, context);
    }
    split(documentType) {
        return new SplitDbSetBuilder_1.SplitDbSetBuilder(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: true
            }
        });
    }
    /**
     * Unmanaged dbset allows users to set a reference from a different set and use it.
     * @param documentType
     * @returns
     */
    unmanagedSplit(documentType) {
        return new SplitDbSetBuilder_1.SplitDbSetBuilder(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: false
            }
        });
    }
}
exports.ExperimentalDbSetInitializer = ExperimentalDbSetInitializer;
//# sourceMappingURL=ExperimentalDbSetInitializer.js.map