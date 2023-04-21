"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetInitializer = void 0;
const DefaultDbSetBuilder_1 = require("./DefaultDbSetBuilder");
class DbSetInitializer {
    constructor(onAddDbSet, context) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }
    default(documentType) {
        return new DefaultDbSetBuilder_1.DefaultDbSetBuilder(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: false,
                isManaged: false
            }
        });
    }
}
exports.DbSetInitializer = DbSetInitializer;
//# sourceMappingURL=DbSetInitializer.js.map