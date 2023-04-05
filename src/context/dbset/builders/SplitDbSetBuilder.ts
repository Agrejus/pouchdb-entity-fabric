import { IDbSet, ISplitDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { SplitDbSet } from '../SplitDbSet';

export class SplitDbSetBuilder<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExtraExclusions extends string,
    TResult extends ISplitDbSet<TDocumentType, TEntity, TExtraExclusions>
> extends DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult> {

    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded 
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    override exclude<T extends string>(...exclusions: T[]) {
        this._exclusions.push(...exclusions);
        return this.createBuilderInstance<TDocumentType, TEntity, T | TExtraExclusions, ISplitDbSet<TDocumentType, TEntity, T | TExtraExclusions>>();
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updates, only adding or removing is available.
     * @returns DbSetBuilder
     */
    override readonly() {
        return this.createBuilderInstance<TDocumentType, Readonly<TEntity>, TExtraExclusions, ISplitDbSet<TDocumentType, Readonly<TEntity>, TExtraExclusions>>();
    }

    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    override create(): TResult {
        return this.createDbSetInstance(SplitDbSet as any);
    }

    protected override createBuilderInstance<KDocumentType extends string, KEntity extends IDbRecord<KDocumentType>, KExtraExclusions extends string, KResult extends ISplitDbSet<KDocumentType, KEntity, KExtraExclusions>>() {
        return new SplitDbSetBuilder<KDocumentType, KEntity, KExtraExclusions, KResult>(this._onCreate, this._buildParams<KExtraExclusions>() as any) as any;
    }
}