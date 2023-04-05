import { IDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, ISplitDbRecord, IUnmanagedSplitDbRecord } from "../../../types/entity-types";
import { DataContext } from "../../DataContext";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";

export class DbSetInitializer<TDocumentType extends string> {

    private _onAddDbSet: (dbset: IDbSetBase<string>) => void;
    private _context: DataContext<TDocumentType>;

    constructor(onAddDbSet: (dbset: IDbSetBase<string>) => void, context: DataContext<TDocumentType>) {
        this._onAddDbSet = onAddDbSet;
        this._context = context;
    }

    default<TEntity extends IDbRecord<TDocumentType>>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity>>(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: false,
                isManaged: false
            }
        });
    }

    split<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends ISplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType", IDbSet<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType">>(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: true
            }
        });
    }

    unmanagedSplit<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends IUnmanagedSplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType", IDbSet<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType">>(this._onAddDbSet, {
            documentType,
            context: this._context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: false
            }
        });
    }
}