export interface IDbSet<TDocumentType extends string, TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> extends IDbSetBase<TDocumentType> {
    add(entity: TEntity): Promise<void>;
    addRange(entities: TEntity[]): Promise<void>;
    remove(entity: TEntity): Promise<void>;
    removeRange(entities: TEntity[]): Promise<void>;
    all(): Promise<(TEntityType & TEntity)[]>;
    filter(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity)[]>;
    find(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity) | undefined>;
    isMatch(first: TEntity, second: TEntity): boolean;
    detach(...entities: TEntity[]): (TEntity & TEntityType)[];
    attach(...entites: (TEntityType & TEntity)[]): void;
    match(entities: IDbRecordBase[]): (TEntityType & TEntity)[];
    first(): Promise<(TEntityType & TEntity)>;
    on(event: DbSetEvent, callback: DbSetEventCallback<TEntity, TDocumentType, TEntityType>): void;
}
export declare type DataContextEventCallback<TDocumentType> = ({ DocumentType }: {
    DocumentType: TDocumentType;
}) => void;
export declare type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';
export declare type DbSetEventCallback<TEntity, TDocumentType extends string, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> = (entity: AttachedEntity<TEntity, TDocumentType, TEntityType>) => void;
export declare type DbSetIdOnlyEventCallback = (entity: string) => void;
export declare type DbSetEvent = "add" | "remove";
export declare type KeyOf<T> = keyof T;
export declare type IdKeys<T> = KeyOf<T>[];
export declare type AttachedEntity<TEntity, TDocumentType extends string, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> = TEntityType & TEntity;
export interface IIndexableEntity {
    [key: string]: any;
}
export interface IDbSetBase<TDocumentType extends string> {
    get DocumentType(): TDocumentType;
    removeAll(): Promise<void>;
    removeById(id: string): Promise<void>;
    removeRangeById(ids: string[]): Promise<void>;
}
export interface IDbSetApi<TDocumentType extends string> {
    getTrackedData: () => ITrackedData;
    getAllData: (documentType: TDocumentType) => Promise<IDbRecordBase[]>;
    send: (data: IDbRecordBase[], shouldThrowOnDuplicate: boolean) => void;
    detach: (data: IDbRecordBase[]) => IDbRecordBase[];
    makeTrackable<T extends Object>(entity: T): T;
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
