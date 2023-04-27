import { DbSetReferenceFetchAdapter } from '../../adapters/reference/DbSetReferenceFetchAdapter';
import { DbSetReferenceModificationAdapter } from '../../adapters/reference/DbSetReferenceModificationAdapter';
import { ISplitDbSet } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSet } from './DbSet';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class SplitDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSet<TDocumentType, TEntity, TExtraExclusions> implements ISplitDbSet<TDocumentType, TEntity, TExtraExclusions> {
    
    lazy() {
        (this._fetchAdapter as DbSetReferenceFetchAdapter<TDocumentType, TEntity, TExtraExclusions>).setLazy();
        return this;
    }  

    include(...properties: string[]) {
        (this._fetchAdapter as DbSetReferenceFetchAdapter<TDocumentType, TEntity, TExtraExclusions>).setInclude(...properties);
        return this;
    }

    async endTransaction() {
        await (this._modificationAdapter as DbSetReferenceModificationAdapter<TDocumentType, TEntity, TExtraExclusions>).endTransaction();
    }

    async startTransaction(transactionId: string) {
        await (this._modificationAdapter as DbSetReferenceModificationAdapter<TDocumentType, TEntity, TExtraExclusions>).startTransaction(transactionId);
    }
}