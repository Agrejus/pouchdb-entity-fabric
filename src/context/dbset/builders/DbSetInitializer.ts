import { IDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { DataContext } from "../../DataContext";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";

export class DbSetInitializer<TDocumentType extends string> {

    protected onAddDbSet: (dbset: IDbSetBase<string>) => void;
    protected context: DataContext<TDocumentType>;

    constructor(onAddDbSet: (dbset: IDbSetBase<string>) => void, context: DataContext<TDocumentType>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends IDbRecord<TDocumentType>>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity>>(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: false,
                isManaged: false
            }
        });
    }
}