"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitDbSet = void 0;
const DbSet_1 = require("./DbSet");
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
class SplitDbSet extends DbSet_1.DbSet {
    withoutReference() {
        this._fetchAdapter.setNextWithoutReference();
        return this;
    }
}
exports.SplitDbSet = SplitDbSet;
//# sourceMappingURL=SplitDbSet.js.map