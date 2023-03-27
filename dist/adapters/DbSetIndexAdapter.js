"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetIndexAdapter = void 0;
const IndexStore_1 = require("../indexing/IndexStore");
const DbSetBaseAdapter_1 = require("./DbSetBaseAdapter");
class DbSetIndexAdapter extends DbSetBaseAdapter_1.DbSetBaseAdapter {
    constructor(props) {
        super(props);
        this.indexStore = new IndexStore_1.IndexStore(props.index);
    }
    get() {
        return this.indexStore.get();
    }
    useIndex(name) {
        this.indexStore.once(name);
    }
}
exports.DbSetIndexAdapter = DbSetIndexAdapter;
//# sourceMappingURL=DbSetIndexAdapter.js.map