"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbSetBuilder = void 0;
const DbSet_1 = require("./DbSet");
class DbSetBuilder {
    constructor(onCreate, params) {
        this._readonly = false;
        this._serializers = [];
        this._deserializers = [];
        this._defaultExtend = (Instance, a) => new Instance(a);
        const { context, documentType, idKeys, defaults, exclusions, events, readonly, extend, keyType, asyncEvents, serializers, deserializers, index } = params;
        this._extend = extend !== null && extend !== void 0 ? extend : [];
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys !== null && idKeys !== void 0 ? idKeys : [];
        this._defaults = defaults !== null && defaults !== void 0 ? defaults : { add: {}, retrieve: {} };
        this._exclusions = exclusions !== null && exclusions !== void 0 ? exclusions : [];
        this._readonly = readonly;
        this._keyType = keyType !== null && keyType !== void 0 ? keyType : "auto";
        this._events = events !== null && events !== void 0 ? events : {
            "add": [],
            "remove": []
        };
        this._asyncEvents = asyncEvents !== null && asyncEvents !== void 0 ? asyncEvents : {
            "add-invoked": [],
            "remove-invoked": []
        };
        this._serializers = serializers !== null && serializers !== void 0 ? serializers : [];
        this._deserializers = deserializers !== null && deserializers !== void 0 ? deserializers : [];
        this._index = index;
        this._onCreate = onCreate;
    }
    _buildParams() {
        return {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            events: this._events,
            exclusions: this._exclusions,
            idKeys: this._idKeys,
            readonly: this._readonly,
            extend: this._extend,
            keyType: this._keyType,
            asyncEvents: this._asyncEvents,
            serializers: this._serializers,
            deserializers: this._deserializers,
            index: this._index
        };
    }
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        return new DbSetBuilder(this._onCreate, this._buildParams());
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
        this._keyType = idBuilder.KeyType;
        return new DbSetBuilder(this._onCreate, this._buildParams());
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
        return new DbSetBuilder(this._onCreate, this._buildParams());
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
        return new DbSetBuilder(this._onCreate, this._buildParams());
    }
    map(map) {
        const keys = Object.keys(map.map);
        if (keys.length === 0) {
            this._deserializers.push({ property: map.property, map: map.map });
        }
        else {
            const instance = map.map;
            if (instance.deserialize != null) {
                this._deserializers.push({ property: map.property, map: instance.deserialize });
            }
            if (instance.serialize != null) {
                this._serializers.push({ property: map.property, map: instance.serialize });
            }
        }
        return new DbSetBuilder(this._onCreate, this._buildParams());
    }
    /**
     * Specify the name of the index to use for all queries
     * @param name Name of the index
     * @returns DbSetBuilder
     */
    useIndex(name) {
        this._index = name;
        return new DbSetBuilder(this._onCreate, this._buildParams());
    }
    on(event, callback) {
        if (event === 'add-invoked' || event === "remove-invoked") {
            this._asyncEvents[event].push(callback);
        }
        else {
            this._events[event].push(callback);
        }
        return new DbSetBuilder(this._onCreate, this._buildParams());
    }
    extend(extend) {
        this._extend.push(extend);
        return new DbSetBuilder(this._onCreate, this._buildParams());
    }
    create(extend) {
        let result;
        if (extend) {
            const dbset = new DbSet_1.DbSet({
                context: this._context,
                defaults: this._defaults,
                documentType: this._documentType,
                idKeys: this._idKeys,
                readonly: this._readonly,
                keyType: this._keyType,
                asyncEvents: this._asyncEvents,
                events: this._events,
                deserializers: this._deserializers,
                serializers: this._serializers,
                index: this._index
            });
            result = extend(dbset);
        }
        else {
            if (this._extend.length === 0) {
                this._extend.push(this._defaultExtend);
            }
            result = this._extend.reduce((a, v, i) => v(i === 0 ? a : a.constructor, {
                context: this._context,
                defaults: this._defaults,
                documentType: this._documentType,
                idKeys: this._idKeys,
                readonly: this._readonly,
                keyType: this._keyType,
                asyncEvents: this._asyncEvents,
                events: this._events,
                deserializers: this._deserializers,
                serializers: this._serializers,
                index: this._index
            }), DbSet_1.DbSet);
        }
        this._onCreate(result);
        return result;
    }
}
exports.DbSetBuilder = DbSetBuilder;
class IdBuilder {
    constructor() {
        this._ids = [];
        this._keyType = "auto";
    }
    get Ids() {
        return this._ids;
    }
    get KeyType() {
        return this._keyType;
    }
    add(key) {
        this._keyType = "user-defined";
        this._ids.push(key);
        return this;
    }
    none() {
        this._keyType = "none";
        return this;
    }
    auto() {
        this._keyType = "auto";
        return this;
    }
}
//# sourceMappingURL=DbSetBuilder.js.map