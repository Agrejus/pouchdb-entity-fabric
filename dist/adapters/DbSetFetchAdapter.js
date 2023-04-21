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
exports.DbSetFetchAdapter = void 0;
const DbSetBaseAdapter_1 = require("./DbSetBaseAdapter");
class DbSetFetchAdapter extends DbSetBaseAdapter_1.DbSetBaseAdapter {
    constructor(props, indexAdapter) {
        super(props);
        this.indexAdapter = indexAdapter;
    }
    query(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.query(request);
        });
    }
    filter(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            const data = yield this.allDataAndMakeTrackable(getIndex);
            const result = [...data].filter(selector);
            yield this.onAfterDataFetched(result);
            this.api.send(result);
            return result;
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            return yield this._all(getIndex);
        });
    }
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const entities = yield this.api.getStrict(...ids);
            const result = entities.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map));
            yield this.onAfterDataFetched(result);
            if (result.length > 0) {
                this.api.send(result);
            }
            return result;
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            const data = yield this.allDataAndMakeTrackable(getIndex);
            const result = [...data].find(selector);
            if (result) {
                yield this.onAfterDataFetched([result]);
                this.api.send([result]);
            }
            return result;
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
            const data = yield this.allDataAndMakeTrackable(getIndex);
            const result = data[0];
            if (result) {
                yield this.onAfterDataFetched([result]);
                this.api.send([result]);
            }
            return result;
        });
    }
}
exports.DbSetFetchAdapter = DbSetFetchAdapter;
//# sourceMappingURL=DbSetFetchAdapter.js.map