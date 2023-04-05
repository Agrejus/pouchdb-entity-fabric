import { cache } from '../../cache/ContextCache';
import { DeepOmit } from '../../types/common-types';
import { IDbSetProps } from '../../types/dbset-types';
import { IDbRecord, IDbRecordBase, IIndexableEntity, SplitDocumentDocumentPropertyName, SplitDocumentPathPropertyName } from '../../types/entity-types';
import { DbSetModificationAdapter } from '../DbSetModificationAdapter';
import { v4 as uuidv4 } from 'uuid';
import { createDocumentReference } from '../../common/LinkedDatabase';
import { IDbSetIndexAdapter } from '../../types/adapter-types';

interface Transaction { transactionId: string, isUse: boolean }

export class DbSetReferenceModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>  {

    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>) {
        super(props, indexAdapter);
    }

    private get _getCacheKey() {
        return `${this.documentType}_TransactionId`;
    }

    private _getTransactionId() {
        const currentTransaction = cache.get<Transaction>(this._getCacheKey);

        if (currentTransaction != null) {

            // mark as in use if started by externally
            cache.upsert(this._getCacheKey, { transactionId: currentTransaction.transactionId, isUse: true });

            return currentTransaction.transactionId;
        }

        return this._getAndStoreAndCreateTransactionId();
    }

    private _formatTransactionId(id: string) {
        return `${this.documentType}_${id}`;
    }

    private _getAndStoreAndCreateTransactionId() {
        const id = uuidv4();
        const newTransactionId = this._formatTransactionId(id);
        cache.upsert(this._getCacheKey, { transactionId: newTransactionId, isUse: true });
        return newTransactionId;
    }

    endTransaction() {
        cache.remove(this._getCacheKey);
    }

    startTransaction(transactionId: string) {
        cache.upsert(this._getCacheKey, { transactionId, isUse: false });
    }

    private get _getReferenceDocumentType() {
        return `${this.documentType}_REFERENCE`
    }

    private _createReferenceDocumentId() {
        const id = uuidv4();
        return `${this._getReferenceDocumentType}/${id}`;
    }

    protected override async onRemove() {
        this.endTransaction();
    }

    override async add(...entities: DeepOmit<TEntity, TExtraExclusions | '_id' | '_rev' | 'DocumentType'>[]) {
        // Removing data should also end the current transaction, otherwise we might delete a db that has remove all of its data
        // We only need to start a new transaction if the current transaction has added data, we will need to increment this
        const currentTransaction = this._getTransactionId();
        const data = this.api.getTrackedData();
        const { add } = data;

        const result = entities.map(entity => {
            const indexableEntity: IIndexableEntity = entity as any;
            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            if (this.splitDbSetOptions.isManaged === true) {
                if (!!indexableEntity[SplitDocumentDocumentPropertyName]["_id"] || !!indexableEntity[SplitDocumentDocumentPropertyName]["_rev"] || !!indexableEntity[SplitDocumentDocumentPropertyName]["DocumentType"]) {
                    throw new Error('Reference entity cannot have an _id, _rev, or DocumentType when adding')
                }
            }

            const processedEntity = this.processAddition(entity) as IIndexableEntity;

            if (this.splitDbSetOptions.isManaged === true) {
                // attach id and document type to reference
                processedEntity[SplitDocumentDocumentPropertyName] = {
                    ...indexableEntity[SplitDocumentDocumentPropertyName],
                    _id: this._createReferenceDocumentId(),
                    DocumentType: this._getReferenceDocumentType
                };

                // create link to document
                processedEntity[SplitDocumentPathPropertyName] = createDocumentReference(indexableEntity[SplitDocumentDocumentPropertyName], currentTransaction);
            }

            const trackableEntity = this.api.makeTrackable(processedEntity, this.defaults.add, this.isReadonly, this.map) as TEntity;

            add.push(trackableEntity as IDbRecordBase);

            return trackableEntity;
        });

        return result
    }
}