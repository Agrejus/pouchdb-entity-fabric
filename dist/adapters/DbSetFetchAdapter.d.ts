import { IDbSetFetchAdapter, IDbSetIndexAdapter } from '../types/adapter-types';
import { EntitySelector } from '../types/common-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
export declare class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {
    protected indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>);
    filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>;
    all(): Promise<TEntity[]>;
    get(...ids: string[]): Promise<TEntity[]>;
    find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>;
    first(): Promise<TEntity>;
}
