import { IDbRecord, IDbRecordBase, IDbSetInfo, OmittedEntity } from "../typings";

export interface IDbSetDestructionAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    empty(): Promise<void>;
}

export interface IDbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    first(): Promise<TEntity | undefined>;
    all(): Promise<TEntity[]>;
    get(...ids: string[]): Promise<TEntity[]>;
}

export interface IDbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    isMatch(first: TEntity, second: any): boolean;
    match(...entities: IDbRecordBase[]): TEntity[];
    info(): IDbSetInfo<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    unlink(...entities: TEntity[]): void;
    link(...entites: TEntity[]): Promise<TEntity[]>;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>
}

export interface IDbSetIndexAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    useIndex(name: string): void;
}

export interface IDbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
}
