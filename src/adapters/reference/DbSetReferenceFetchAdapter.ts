import { IDbRecord, IDbSetProps } from '../../typings';
import { DbSetFetchAdapter } from '../DbSetFetchAdapter';
import { IDbSetFetchAdapter } from '../types';

export class DbSetReferenceFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>  {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    
}