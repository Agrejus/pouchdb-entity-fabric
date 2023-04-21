import { IDbRecord } from "../types/entity-types";
interface IValidationResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
}
export declare const validateAttachedEntity: <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>>(entity: TEntity) => IValidationResult<TDocumentType, TEntity>[];
export {};
