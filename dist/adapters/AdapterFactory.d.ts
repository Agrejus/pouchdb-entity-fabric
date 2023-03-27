import { IDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
export declare class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    private _props;
    constructor(props: IDbSetProps<TDocumentType, TEntity>);
    createFetchAdapter(indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>): IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>;
    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>;
    createIndexAdapter(): IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    createModificationAdapter(indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>): IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
}
