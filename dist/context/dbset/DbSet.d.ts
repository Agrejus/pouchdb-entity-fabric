import { EntitySelector } from '../../types/common-types';
import { IDbSet, IDbSetProps, IDbSetEnumerable } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export declare class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {
    private readonly _fetchAdapter;
    private readonly _generalAdapter;
    private readonly _indexAdapter;
    private readonly _modificationAdapter;
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
}
