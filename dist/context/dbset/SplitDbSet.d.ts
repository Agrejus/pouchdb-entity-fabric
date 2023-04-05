import { ISplitDbSet } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSet } from './DbSet';
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class SplitDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSet<TDocumentType, TEntity, TExtraExclusions> implements ISplitDbSet<TDocumentType, TEntity, TExtraExclusions> {
    withoutReference(): this;
}
