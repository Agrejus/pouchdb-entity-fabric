import { IDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { DataContext } from "../../DataContext";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
export declare class DbSetInitializer<TDocumentType extends string> {
    protected onAddDbSet: (dbset: IDbSetBase<string>) => void;
    protected context: DataContext<TDocumentType>;
    constructor(onAddDbSet: (dbset: IDbSetBase<string>) => void, context: DataContext<TDocumentType>);
    default<TEntity extends IDbRecord<TDocumentType>>(documentType: TEntity["DocumentType"]): DefaultDbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity, never>>;
}
