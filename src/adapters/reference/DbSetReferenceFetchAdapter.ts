import { IDbSetProps } from '../../types/dbset-types';
import { IDbRecord, IDbRecordBase, IReferenceDbRecord, ReferenceDocumentPropertyName, ReferencePathPropertyName } from '../../types/entity-types';
import { DbSetFetchAdapter } from '../DbSetFetchAdapter';
import { IDbSetFetchAdapter } from '../../types/adapter-types';
import { parseDocumentReference } from '../../common/LinkedDatabase';

export class DbSetReferenceFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>  {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    protected override async onAfterDataFetched(data: TEntity[]) {
        const documentsWithReferences = data.filter(w => !!(w as any)[ReferencePathPropertyName]);

        const referenceModifications: { [key: string]: IDbRecordBase[] } = {};


        for(const item of documentsWithReferences) {
            const castedItem = (item as any);
            const document = castedItem[ReferenceDocumentPropertyName] as IDbRecordBase;
            const referencePath = castedItem[ReferencePathPropertyName] as string;
            const reference = parseDocumentReference(referencePath)

            // Need to get all of the ids and only load what we need in case there is large data

            // if (!referenceModifications[reference.databaseName]) {
            //     referenceModifications[reference.databaseName] = []; 
            // }
            // referenceModifications[reference.databaseName].push(referencePath)

        }

    }
}