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
exports.SplitDbSet = void 0;
const DbSet_1 = require("./DbSet");
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
class SplitDbSet extends DbSet_1.DbSet {
    lazy() {
        this._fetchAdapter.setLazy();
        return this;
    }
    include(...properties) {
        this._fetchAdapter.setInclude(...properties);
        return this;
    }
    endTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._modificationAdapter.endTransaction();
        });
    }
    startTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._modificationAdapter.startTransaction(transactionId);
        });
    }
}
exports.SplitDbSet = SplitDbSet;
//# sourceMappingURL=SplitDbSet.js.map