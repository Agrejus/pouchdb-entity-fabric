"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitDbSetBuilder = void 0;
const DefaultDbSetBuilder_1 = require("./DefaultDbSetBuilder");
const SplitDbSet_1 = require("../SplitDbSet");
class SplitDbSetBuilder extends DefaultDbSetBuilder_1.DefaultDbSetBuilder {
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
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        return this.createBuilderInstance();
    }
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create() {
        return this.createDbSetInstance(SplitDbSet_1.SplitDbSet);
    }
    createBuilderInstance() {
        return new SplitDbSetBuilder(this._onCreate, this._buildParams());
    }
}
exports.SplitDbSetBuilder = SplitDbSetBuilder;
//# sourceMappingURL=SplitDbSetBuilder.js.map