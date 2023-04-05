"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDbSetBuilder = void 0;
const DbSet_1 = require("../DbSet");
const dbset_builder_types_1 = require("../../../types/dbset-builder-types");
class DefaultDbSetBuilder {
    constructor(onCreate, params) {
        this._readonly = false;
        this._map = [];
        this._defaultExtend = (Instance, a) => new Instance(a);
        const { context, documentType, idKeys, defaults, exclusions, readonly, extend, keyType, map, index, isSplitDbSet } = params;
        this._extend = extend !== null && extend !== void 0 ? extend : [];
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys !== null && idKeys !== void 0 ? idKeys : [];
        this._defaults = defaults !== null && defaults !== void 0 ? defaults : { add: {}, retrieve: {} };
        this._exclusions = exclusions !== null && exclusions !== void 0 ? exclusions : [];
        this._readonly = readonly;
        this._keyType = keyType !== null && keyType !== void 0 ? keyType : "auto";
        this._map = map !== null && map !== void 0 ? map : [];
        this._index = index;
        this._isSplitDbSet = isSplitDbSet;
        this._onCreate = onCreate;
    }
    _buildParams() {
        const params = {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            exclusions: this._exclusions,
            idKeys: this._idKeys,
            readonly: this._readonly,
            extend: this._extend,
            keyType: this._keyType,
            map: this._map,
            index: this._index,
            isSplitDbSet: this._isSplitDbSet
        };
        return params;
    }
    createBuilderInstance() {
        return new DefaultDbSetBuilder(this._onCreate, this._buildParams());
    }
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        return this.createBuilderInstance();
    }
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder) {
        const idBuilder = new dbset_builder_types_1.IdBuilder();
        builder(idBuilder);
        this._idKeys.push(...idBuilder.Ids);
        this._keyType = idBuilder.KeyType;
        return this.createBuilderInstance();
    }
    defaults(value) {
        if ("add" in value) {
            this._defaults = Object.assign(Object.assign({}, this._defaults), { add: Object.assign(Object.assign({}, this._defaults.add), value.add) });
        }
        if ("retrieve" in value) {
            this._defaults = Object.assign(Object.assign({}, this._defaults), { retrieve: Object.assign(Object.assign({}, this._defaults.retrieve), value.retrieve) });
        }
        if (!("retrieve" in value) && !("add" in value)) {
            this._defaults = Object.assign(Object.assign({}, this._defaults), { add: Object.assign(Object.assign({}, this._defaults.add), value), retrieve: Object.assign(Object.assign({}, this._defaults.retrieve), value) });
        }
        return this.createBuilderInstance();
    }
    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude(...exclusions) {
        this._exclusions.push(...exclusions);
        return this.createBuilderInstance();
    }
    map(propertyMap) {
        this._map.push(propertyMap);
        return this.createBuilderInstance();
    }
    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name) {
        this._index = name;
        return this.createBuilderInstance();
    }
    extend(extend) {
        this._extend.push(extend);
        return this.createBuilderInstance();
    }
    createDbSetInstance(Initializer) {
        if (this._extend.length === 0) {
            this._extend.push(this._defaultExtend);
        }
        const result = this._extend.reduce((a, v, i) => v(i === 0 ? a : a.constructor, {
            context: this._context,
            defaults: this._defaults,
            documentType: this._documentType,
            idKeys: this._idKeys,
            readonly: this._readonly,
            keyType: this._keyType,
            map: this._map,
            index: this._index,
            splitDbSetOptions: this._isSplitDbSet
        }), Initializer);
        this._onCreate(result);
        return result;
    }
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create() {
        return this.createDbSetInstance(DbSet_1.DbSet);
    }
}
exports.DefaultDbSetBuilder = DefaultDbSetBuilder;
//# sourceMappingURL=DefaultDbSetBuilder.js.map