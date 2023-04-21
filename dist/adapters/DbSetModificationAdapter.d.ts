import { IDbSetIndexAdapter, IDbSetModificationAdapter } from '../types/adapter-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord, OmittedEntity } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
export declare class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {
    protected indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>);
    protected processAddition(entity: OmittedEntity<TEntity, TExtraExclusions>): IDbRecord<TDocumentType>;
    protected processAdditionAndMakeTrackable(entity: OmittedEntity<TEntity, TExtraExclusions>): TEntity;
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    protected onRemove(): Promise<void>;
    empty(): Promise<void>;
    private _remove;
    protected _removeById(id: string): Promise<void>;
}
