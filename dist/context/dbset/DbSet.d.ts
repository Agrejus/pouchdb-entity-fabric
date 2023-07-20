/// <reference types="pouchdb-find" />
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { DeepPartial, EntitySelector } from '../../types/common-types';
import { IDbSetProps, IDbSetEnumerable, IDbSet } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {
    protected readonly _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _generalAdapter: IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _modificationAdapter: IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
    get types(): {
        modify: import("../../types/common-types").DeepOmit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions>;
        result: TEntity;
        documentType: TEntity["DocumentType"];
        map: { [DocumentType_1 in TEntity["DocumentType"]]: TEntity; };
    };
    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity>);
    info(): import("../../types/dbset-types").IDbSetInfo<TDocumentType, TEntity>;
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    useIndex(name: string): IDbSetEnumerable<TDocumentType, TEntity>;
    empty(): Promise<void>;
    all(): Promise<TEntity[]>;
    filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>;
    isMatch(first: TEntity, second: any): boolean;
    match(...items: IDbRecordBase[]): TEntity[];
    get(...ids: string[]): Promise<TEntity[]>;
    find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>;
    unlink(...entities: TEntity[]): void;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    link(...entities: TEntity[]): Promise<TEntity[]>;
    first(): Promise<TEntity>;
    query(request: DeepPartial<PouchDB.Find.FindRequest<TEntity>>): Promise<PouchDB.Find.FindResponse<TEntity>>;
    private merge;
}
