import { DeepOmit } from '../../types/common-types';
import { IDbSetProps } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSetModificationAdapter } from '../DbSetModificationAdapter';
import { IDbSetIndexAdapter } from '../../types/adapter-types';
export declare class DbSetReferenceModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {
    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>);
    private get _getCacheKey();
    private _getTransactionId;
    private _formatTransactionId;
    private _getAndStoreAndCreateTransactionId;
    endTransaction(): void;
    startTransaction(transactionId: string): void;
    private get _getReferenceDocumentType();
    private _createReferenceDocumentId;
    protected onRemove(): Promise<void>;
    add(...entities: DeepOmit<TEntity, TExtraExclusions | '_id' | '_rev' | 'DocumentType'>[]): Promise<TEntity[]>;
}
