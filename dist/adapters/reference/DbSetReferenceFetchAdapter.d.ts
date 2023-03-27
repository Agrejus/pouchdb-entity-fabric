import { IDbSetProps } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSetFetchAdapter } from '../DbSetFetchAdapter';
import { IDbSetFetchAdapter, IDbSetIndexAdapter } from '../../types/adapter-types';
export declare class DbSetReferenceFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {
    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>);
    private _getMany;
    protected onAfterDataFetched(data: TEntity[]): Promise<void>;
}
