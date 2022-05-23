declare interface IDbSetApi<TDocumentType extends string> {
    getTrackedData: () => ITrackedData;
    getAllData: (documentType: TDocumentType) => Promise<IDbRecordBase[]>;
    send: (data: IDbRecordBase[]) => void;
    detach: (data: IDbRecordBase[], matcher: (first: IDbRecordBase, second: IDbRecordBase) => boolean) => IDbRecordBase[]
}

// can we make readonly props? _id, _rev, DocumentType?
declare interface IDbRecord<TDocumentType> extends IDbAdditionRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}

declare interface IDbAdditionRecord<T> {
    DocumentType: T;
}

declare interface IDbRecordBase extends IDbRecord<any> {

}

declare interface IBulkDocsResponse {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}

declare interface IDbSetInitialized {
    [key: string]: boolean
}

declare type DataContextInitialized = boolean | IDbSetInitialized

declare interface IDataContext {
    saveChanges(): Promise<number>;
}

declare interface ITrackedData {
    add: IDbRecordBase[];
    remove: IDbRecordBase[];
    attach: IDbRecordBase[];
    removeById: string[]
}

declare interface IContextOptions<TDocumentType extends string, TIndexType extends string> {
    documentType?: TDocumentType;
    index?: TIndexType
}

declare type DataLoadingScope = "dbset" | "context"
declare interface IModelCreatingOptions {
    dataLoading: {
        scope: DataLoadingScope;
    }
}