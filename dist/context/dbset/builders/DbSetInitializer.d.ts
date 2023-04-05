import { IDbSet, ISplitDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, ISplitDbRecord, IUnmanagedSplitDbRecord } from "../../../types/entity-types";
import { DataContext } from "../../DataContext";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { SplitDbSetBuilder } from "./SplitDbSetBuilder";
export declare class DbSetInitializer<TDocumentType extends string> {
    private _onAddDbSet;
    private _context;
    constructor(onAddDbSet: (dbset: IDbSetBase<string>) => void, context: DataContext<TDocumentType>);
    default<TEntity extends IDbRecord<TDocumentType>>(documentType: TEntity["DocumentType"]): DefaultDbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity, never>>;
    split<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends ISplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]): SplitDbSetBuilder<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType", ISplitDbSet<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType">>;
    unmanagedSplit<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends IUnmanagedSplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TEntity["DocumentType"]): SplitDbSetBuilder<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType", ISplitDbSet<TDocumentType, TEntity, "reference" | "reference._id" | "reference._rev" | "reference.DocumentType">>;
}
