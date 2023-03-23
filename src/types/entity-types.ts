import { DeepOmit, IdKey, PouchDbReference } from "./common-types";

export type OmittedEntity<TEntity, TExtraExclusions extends string = never> = DeepOmit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions>;

export interface IDbRecord<TDocumentType extends string> extends IDbAdditionRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}


export const ReferencePathPropertyName = "referencePath";
export const ReferenceDocumentPropertyName = "reference";
export interface IReferenceDbRecord<TDocumentType extends string, TReferenceDocumentType extends string, TReferenceEntity extends IDbRecord<TReferenceDocumentType>> extends IDbRecord<TDocumentType> {
    [ReferencePathPropertyName]: PouchDbReference;
    [ReferenceDocumentPropertyName]: TReferenceEntity;
}

export interface IDbAdditionRecord<TDocumentType extends string> {
    readonly DocumentType: TDocumentType;
}

export interface IDbRecordBase extends IDbRecord<any> {

}

export type IRemovalRecord = IDbRecordBase & { _deleted: boolean };

export interface IIndexableEntity<T extends any = any> {
    [key: string]: T;
}

export type EntityIdKeys<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = EntityIdKey<TDocumentType, TEntity>[];
export type EntityIdKey<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = IdKey<Omit<TEntity, "_id" | "_rev" | "DocumentType">>;