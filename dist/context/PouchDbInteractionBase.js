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
exports.PouchDbInteractionBase = void 0;
const PouchDbBase_1 = require("./PouchDbBase");
class PouchDbInteractionBase extends PouchDbBase_1.PouchDbBase {
    constructor(name, options) {
        super(name, options);
    }
    formatBulkDocsResponse(response) {
        const result = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };
        for (let item of response) {
            if ('error' in item) {
                const error = item;
                if (!error.id) {
                    continue;
                }
                result.errors_count += 1;
                result.errors[error.id] = {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                };
                continue;
            }
            const success = item;
            result.successes_count += 1;
            result.successes[success.id] = {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            };
        }
        return result;
    }
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    bulkDocs(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.doWork(w => w.bulkDocs(entities));
            return this.formatBulkDocsResponse(response);
        });
    }
    /**
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids
     */
    getStrict(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ids.length === 0) {
                return [];
            }
            const result = yield this.doWork(w => w.bulkGet({ docs: ids.map(x => ({ id: x })) }));
            return result.results.map(w => {
                const result = w.docs[0];
                if ('error' in result) {
                    throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`);
                }
                return result.ok;
            });
        });
    }
    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids
     */
    get(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.doWork(w => w.find({
                    selector: {
                        _id: {
                            $in: ids
                        }
                    }
                }), false);
                return result.docs;
            }
            catch (e) {
                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }
                return [];
            }
        });
    }
    query(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.doWork(w => w.find(selector));
            }
            catch (e) {
                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }
                return {
                    docs: [],
                    warning: JSON.stringify(e, Object.getOwnPropertyNames(e))
                };
            }
        });
    }
    find(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(selector);
            return result.docs;
        });
    }
    /**
     * Gets all data from the data store
     */
    getAllData(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const findOptions = {
                    selector: {},
                };
                if ((payload === null || payload === void 0 ? void 0 : payload.documentType) != null) {
                    findOptions.selector.DocumentType = payload.documentType;
                }
                if ((payload === null || payload === void 0 ? void 0 : payload.index) != null) {
                    findOptions.use_index = payload.index;
                }
                const result = yield this.find(findOptions);
                return result;
            }
            catch (e) {
                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }
                return [];
            }
        });
    }
}
exports.PouchDbInteractionBase = PouchDbInteractionBase;
//# sourceMappingURL=PouchDbInteractionBase.js.map