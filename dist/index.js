"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDbSetBuilder = exports.DbSet = exports.ExperimentalDataContext = exports.DataContext = void 0;
var DataContext_1 = require("./context/DataContext");
Object.defineProperty(exports, "DataContext", { enumerable: true, get: function () { return DataContext_1.DataContext; } });
var ExperimentalDataContext_1 = require("./context/ExperimentalDataContext");
Object.defineProperty(exports, "ExperimentalDataContext", { enumerable: true, get: function () { return ExperimentalDataContext_1.ExperimentalDataContext; } });
var DbSet_1 = require("./context/dbset/DbSet");
Object.defineProperty(exports, "DbSet", { enumerable: true, get: function () { return DbSet_1.DbSet; } });
var DefaultDbSetBuilder_1 = require("./context/dbset/builders/DefaultDbSetBuilder");
Object.defineProperty(exports, "DefaultDbSetBuilder", { enumerable: true, get: function () { return DefaultDbSetBuilder_1.DefaultDbSetBuilder; } });
//# sourceMappingURL=index.js.map