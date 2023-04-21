import { DbSetPickDefaultActionRequired } from './common-types';
import { EntityIdKey, EntityIdKeys, IDbRecord } from './entity-types';
import { IDbSet, IDbSetProps } from './dbset-types';
import { DbSet } from '../context/dbset/DbSet';
import { IDataContext } from './context-types';

export interface ISplitDbSetOptions {
    enabled: boolean;
    isManaged: boolean;
}

export interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string, TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> {
    context: IDataContext;
    documentType: TDocumentType;
    isSplitDbSet: ISplitDbSetOptions;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    exclusions?: string[];
    readonly: boolean;
    extend?: DbSetExtenderCreator<TDocumentType, TEntity, TExtraExclusions, TResult>[]
    keyType?: DbSetKeyType;
    map?: PropertyMap<TDocumentType, TEntity, any>[];
    index?: string;
}

export type ConvertDateToString<T> = T extends Date ? string : T;
export type DbSetExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string, TResult extends IDbSet<TDocumentType, TEntity, TExtraExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExtraExclusions>, args: IDbSetProps<TDocumentType, TEntity>) => TResult

export type PropertyMap<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends keyof TEntity> = { property: TProperty, map: (value: ConvertDateToString<TEntity[TProperty]>, entity: TEntity) => TEntity[TProperty] }

export interface ITerminateIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

}

export interface IChainIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    /**
     * Used to build a key for the entity.  Key will be built in the order
     * the keys or selectors are added
     * @param key Key or property selector
     */
    add(key: EntityIdKey<TDocumentType, TEntity>): IChainIdBuilder<TDocumentType, TEntity>;
}

export interface IIdBuilderBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends IChainIdBuilder<TDocumentType, TEntity> {

    /**
     * No keys, will only allow one single instance or record for the document type
     */
    none(): ITerminateIdBuilder<TDocumentType, TEntity>;

    /**
     * Key will be automatically generated
     */
    auto(): ITerminateIdBuilder<TDocumentType, TEntity>;
}

export type DbSetExtender<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> = new (props: IDbSetProps<TDocumentType, TEntity>) => DbSet<TDocumentType, TEntity, TExtraExclusions>;

export type DbSetKeyType = "auto" | "none" | "user-defined";

export class IdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IIdBuilderBase<TDocumentType, TEntity> {

    private _ids: EntityIdKeys<TDocumentType, TEntity> = [];
    private _keyType: DbSetKeyType = "auto"

    get Ids() {
        return this._ids;
    }

    get KeyType() {
        return this._keyType;
    }

    add(key: EntityIdKey<TDocumentType, TEntity>) {
        this._keyType = "user-defined";
        this._ids.push(key);
        return this;
    }

    none() {
        this._keyType = "none";
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }

    auto() {
        this._keyType = "auto";
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }
}