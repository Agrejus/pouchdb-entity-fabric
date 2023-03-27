import { IDbRecord, IDbRecordBase, OmittedEntity } from './entity-types';
import { IDbSetInfo } from './dbset-types';
export interface IDbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    first(): Promise<TEntity | undefined>;
    all(): Promise<TEntity[]>;
    get(...ids: string[]): Promise<TEntity[]>;
}
export interface IDbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    isMatch(first: TEntity, second: any): boolean;
    match(...entities: IDbRecordBase[]): TEntity[];
    info(): IDbSetInfo<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    unlink(...entities: TEntity[]): void;
    link(...entites: TEntity[]): Promise<TEntity[]>;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
}
export interface IDbSetIndexAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    useIndex(name: string): void;
    get(): string | null;
}
export interface IDbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    empty(): Promise<void>;
}
