import { IDbRecord, IDbSetProps } from "../typings";
import { DbSetDestructionAdapter } from "./DbSetDestructionAdapter";
import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetIndexAdapter } from "./DbSetIndexAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { IDbSetDestructionAdapter, IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from "./types";
import { DbSetReferenceFetchAdapter } from './reference/DbSetReferenceFetchAdapter';

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {

    private _props: IDbSetProps<TDocumentType, TEntity>;

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        this._props = props;
    }

    createDestructionAdapter(): IDbSetDestructionAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetDestructionAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createFetchAdapter(): IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {

        if (this._props.isRefrenceDbSet) {
            return new DbSetReferenceFetchAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
        }

        return new DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createIndexAdapter(): IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props)
    }
}