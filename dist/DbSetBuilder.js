"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetBuilder = void 0;
const DbSet_1 = require("./DbSet");
class DbSetBuilder {
    constructor(params) {
        const { context, documentType, idKeys, defaults, exclusions, events } = params;
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys !== null && idKeys !== void 0 ? idKeys : [];
        this._defaults = defaults !== null && defaults !== void 0 ? defaults : {};
        this._exclusions = exclusions !== null && exclusions !== void 0 ? exclusions : [];
        this._events = events !== null && events !== void 0 ? events : {
            "add": [],
            "remove": []
        };
    }
    _buildParams() {
        return {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            events: this._events,
            exclusions: this._exclusions,
            idKeys: this._idKeys
        };
    }
    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder) {
        const idBuilder = new IdBuilder();
        builder(idBuilder);
        this._idKeys.push(...idBuilder.Ids);
        return new DbSetBuilder(this._buildParams());
    }
    /**
     * Set default values on add or retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be
     * set when the property does not exist or is excluded
     * @param defaultEntity Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(defaultEntity) {
        this._defaults = Object.assign(Object.assign({}, this._defaults), defaultEntity);
        return new DbSetBuilder(this._buildParams());
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
        return new DbSetBuilder(this._buildParams());
    }
    on(event, callback) {
        this._events[event].push(callback);
        return new DbSetBuilder(this._buildParams());
    }
    /**
     * Must call to fully create the DbSet.  Can use the extend callback to add functionality to the DbSet
     * @param extend Can be used to add functionality to the DbSet
     * @returns new DbSet
     */
    create(extend = w => w) {
        const dbset = new DbSet_1.DbSet(this._documentType, this._context, this._defaults, ...this._idKeys);
        return extend(dbset);
    }
}
exports.DbSetBuilder = DbSetBuilder;
class IdBuilder {
    constructor() {
        this._ids = [];
    }
    get Ids() {
        return this._ids;
    }
    add(key) {
        this._ids.push(key);
        return this;
    }
}
//# sourceMappingURL=DbSetBuilder.js.map