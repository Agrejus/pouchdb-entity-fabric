import { ISplitDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, ISplitDbRecord, IUnmanagedSplitDbRecord } from "../../../types/entity-types";
import { DataContext } from "../../DataContext";
import { DbSetInitializer } from "./DbSetInitializer";
import { SplitDbSetBuilder } from "./SplitDbSetBuilder";

export class ExperimentalDbSetInitializer<TDocumentType extends string> extends DbSetInitializer<TDocumentType> {

    constructor(onAddDbSet: (dbset: IDbSetBase<string>) => void, context: DataContext<TDocumentType>) {
        super(onAddDbSet, context)
    }

    split<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends ISplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]) {
        return new SplitDbSetBuilder<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType", ISplitDbSet<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType">>(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: true
            }
        });
    }

    /**
     * Unmanaged dbset allows users to set a reference from a different set and use it.  
     * @param documentType 
     * @returns 
     */
    unmanagedSplit<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends IUnmanagedSplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]) {
        return new SplitDbSetBuilder<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType", ISplitDbSet<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType">>(this.onAddDbSet, {
            documentType,
            context: this.context,
            readonly: false,
            isSplitDbSet: {
                enabled: true,
                isManaged: false
            }
        });
    }
}