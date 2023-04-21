import { DeepOmit } from '../../types/common-types';
import { IDbSetProps } from '../../types/dbset-types';
import { IDbRecord, IDbRecordBase, IIndexableEntity, SplitDocumentDocumentPropertyName, SplitDocumentPathPropertyName } from '../../types/entity-types';
import { DbSetModificationAdapter } from '../DbSetModificationAdapter';
import { v4 as uuidv4 } from 'uuid';
import { createDocumentReference } from '../../common/LinkedDatabase';
import { IDbSetIndexAdapter } from '../../types/adapter-types';
import { AsyncCache } from '../../cache/AsyncCache';

interface Transaction { transactionId: string, _id: string }

export class DbSetReferenceModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>  {

    private _asyncCache: AsyncCache = new AsyncCache();

    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>) {
        super(props, indexAdapter);
    }

    private get _getCacheKey() {
        return `${this.documentType}_TransactionId`;
    }

    private async _getTransactionId() {

        const currentTransaction = await this._asyncCache.get<Transaction>(this._getCacheKey);

        if (currentTransaction != null) {

            return currentTransaction.transactionId;
        }

        return await this._createAndSaveTransactionId();
    }

    private _formatTransactionId(id: string) {
        return `${this.documentType}_PEF-REFERENCE_${id}`;
    }

    private async _createAndSaveTransactionId() {
        const id = uuidv4();
        const newTransactionId = this._formatTransactionId(id);
        await this._asyncCache.set<Transaction>({ _id: this._getCacheKey, transactionId: newTransactionId });
        return newTransactionId;
    }

    async endTransaction() {
        await this._asyncCache.remove(this._getCacheKey);
    }

    async startTransaction(transactionId: string) {
        await this._asyncCache.set<Transaction>({ _id: this._getCacheKey, transactionId });
    }

    private get _getReferenceDocumentType() {
        return `${this.documentType}_REFERENCE`
    }

    private _createReferenceDocumentId() {
        const id = uuidv4();
        return `${this._getReferenceDocumentType}/${id}`;
    }

    protected override async onRemove() {
        await this.endTransaction();
    }

    override async add(...entities: DeepOmit<TEntity, TExtraExclusions | '_id' | '_rev' | 'DocumentType'>[]) {
        // Removing data should also end the current transaction, otherwise we might delete a db that has remove all of its data
        // We only need to start a new transaction if the current transaction has added data, we will need to increment this
        const currentTransaction = await this._getTransactionId();
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