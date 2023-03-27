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
exports.PouchDbBase = void 0;
const pouchdb_1 = __importDefault(require("pouchdb"));
class PouchDbBase {
    constructor(name, options) {
        this._dbOptions = options;
        this._dbName = name;
    }
    createDb() {
        return new pouchdb_1.default(this._dbName, this._dbOptions);
    }
    doWork(action, shouldClose = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.createDb();
            const result = yield action(db);
            if (shouldClose) {
                yield db.close();
            }
            return result;
        });
    }
}
exports.PouchDbBase = PouchDbBase;
//# sourceMappingURL=PouchDbBase.js.map