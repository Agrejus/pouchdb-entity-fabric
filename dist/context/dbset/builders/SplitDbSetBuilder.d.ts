import { ISplitDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
export declare class SplitDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string, TResult extends ISplitDbSet<TDocumentType, TEntity, TExtraExclusions>> extends DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult> {
    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends string>(...exclusions: T[]): any;
    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly(): any;
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create(): TResult;
    protected createBuilderInstance<KDocumentType extends string, KEntity extends IDbRecord<KDocumentType>, KExtraExclusions extends string, KResult extends ISplitDbSet<KDocumentType, KEntity, KExtraExclusions>>(): any;
}
