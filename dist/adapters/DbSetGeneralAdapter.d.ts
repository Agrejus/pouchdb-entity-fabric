import { IDbSetGeneralAdapter } from '../types/adapter-types';
import { IDbSetProps, IDbSetInfo } from '../types/dbset-types';
import { IDbRecord, IDbRecordBase } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
export declare class DbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {
    constructor(props: IDbSetProps<TDocumentType, TEntity>);
    isMatch(first: TEntity, second: any): boolean;
    match(...items: IDbRecordBase[]): TEntity[];
    info(): IDbSetInfo<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    unlink(...entities: TEntity[]): void;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    link(...entities: TEntity[]): Promise<TEntity[]>;
    private _detachItems;
}
