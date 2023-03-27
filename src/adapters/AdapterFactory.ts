import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetIndexAdapter } from "./DbSetIndexAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetReferenceFetchAdapter } from './reference/DbSetReferenceFetchAdapter';
import { IDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { DbSetReferenceModificationAdapter } from './reference/DbSetReferenceModificationAdapter';
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from "../types/adapter-types";

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {

    private _props: IDbSetProps<TDocumentType, TEntity>;

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        this._props = props;
    }

    createFetchAdapter(indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>): IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {

        if (this._props.isSplitDbSet) {
            return new DbSetReferenceFetchAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, indexAdapter)
        }

        return new DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, indexAdapter)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createIndexAdapter(): IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createModificationAdapter(indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>): IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {
        if (this._props.isSplitDbSet) {
            return new DbSetReferenceModificationAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, indexAdapter)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, indexAdapter)
    }
}