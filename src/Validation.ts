import { IDbRecord } from "./typings";

interface IValidationResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
}

export const validateAttachedEntity = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>>(entity: TEntity) => {

    const properties: (keyof TEntity)[] = ["_id", "_rev", "DocumentType"];

    return properties.map(w => {
        const value = entity[w];
        const result: IValidationResult<TDocumentType, TEntity> = {
            ok: true,
            propertyName: w,
            error: ""
        };

        if (value == null) {
            result.ok = false;
            result.error = `Property cannot be null or undefined.  Property: ${String(w)}, Entity: ${JSON.stringify(entity)}`
            return result;
        }

        return result;
    })
}