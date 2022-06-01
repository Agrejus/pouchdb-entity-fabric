export interface IDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> extends IDbSetBase<TDocumentType> {
    add(entity: OmittedEntity<TEntity>): Promise<TEntity>;
    addRange(entities: OmittedEntity<TEntity>[]): Promise<TEntity[]>;
    remove(entity: TEntity): Promise<void>;
    removeRange(entities: TEntity[]): Promise<void>;
    all(): Promise<TEntity[]>;
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    isMatch(first: TEntity, second: TEntity): boolean;
    detach(...entities: TEntity[]): TEntity[];
    attach(...entites: TEntity[]): void;
    match(entities: IDbRecordBase[]): TEntity[];
    first(): Promise<TEntity>;
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>): void;
}
export declare type OmittedEntity<TEntity> = Omit<TEntity, "_id" | "_rev" | "DocumentType">;
export declare type DataContextEventCallback<TDocumentType> = ({ DocumentType }: {
    DocumentType: TDocumentType;
}) => void;
export declare type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';
export declare type DbSetEventCallback<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> = (entity: TEntity) => void;
export declare type DbSetIdOnlyEventCallback = (entity: string) => void;
export declare type DbSetEvent = "add" | "remove";
export declare type KeyOf<T> = keyof T;
export declare type IdKeys<T> = KeyOf<T>[];
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
