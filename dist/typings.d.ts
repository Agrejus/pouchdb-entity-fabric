export interface IDbSet<TDocumentType extends string, TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> extends IDbSetBase<TDocumentType> {
    add(entity: TEntity): Promise<void>;
    addRange(entities: TEntity[]): Promise<void>;
    remove(entity: TEntity): Promise<void>;
    removeRange(entities: TEntity[]): Promise<void>;
    all(): Promise<(TEntityType & TEntity)[]>;
    filter(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity)[]>;
    find(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity) | undefined>;
    onBeforeAdd(action: (entity: TEntity & TEntityType) => void): void;
    isMatch(first: TEntity, second: TEntity): boolean;
    detach(entities: TEntity[]): (TEntity & TEntityType)[];
    match(entities: IDbRecordBase[]): (TEntityType & TEntity)[];
}
export declare type KeyOf<T> = keyof T;
export declare type IdKeys<T> = KeyOf<T>[];
export interface IDbSetBase<TDocumentType extends string> {
    get DocumentType(): TDocumentType;
    removeAll(): Promise<void>;
    removeById(id: string): Promise<void>;
    removeRangeById(ids: string[]): Promise<void>;
}
export interface IDbSetApi<TDocumentType extends string> {
    getTrackedData: () => ITrackedData;
    getAllData: (documentType: TDocumentType) => Promise<IDbRecordBase[]>;
    send: (data: IDbRecordBase[]) => void;
    detach: (data: IDbRecordBase[], matcher: (first: IDbRecordBase, second: IDbRecordBase) => boolean) => IDbRecordBase[];
}
export interface IDbRecord<TDocumentType> extends IDbAdditionRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}
export interface IDbAdditionRecord<T> {
    DocumentType: T;
}
export interface IDbRecordBase extends IDbRecord<any> {
}
export interface IBulkDocsResponse {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}
export interface IDbSetInitialized {
    [key: string]: boolean;
}
export interface IDataContext {
    saveChanges(): Promise<number>;
    getAllDocs(): Promise<IDbRecordBase[]>;
}
export interface ITrackedData {
    add: IDbRecordBase[];
    remove: IDbRecordBase[];
    attach: IDbRecordBase[];
    removeById: string[];
}
