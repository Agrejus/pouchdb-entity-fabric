import { EntityIdKeys, IDbRecord } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { IDbSetApi, IDbSetProps } from '../types/dbset-types';
import { DbSetKeyType, ISplitDbSetOptions, PropertyMap } from '../types/dbset-builder-types';
export declare abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {
    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    protected idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType>;
    protected api: IDbSetApi<TDocumentType>;
    protected isReadonly: boolean;
    protected keyType: DbSetKeyType;
    protected map: PropertyMap<TDocumentType, TEntity, any>[];
    protected splitDbSetOptions: ISplitDbSetOptions;
    protected filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    constructor(props: IDbSetProps<TDocumentType, TEntity>);
    protected allDataAndMakeTrackable(getIndex: () => string | null): Promise<TEntity[]>;
    protected onAfterDataFetched(data: TEntity[]): Promise<void>;
    private deconstructQuery;
    protected convertFilterSelector(selector: EntitySelector<TDocumentType, TEntity>): Promise<void>;
    protected _all(getIndex: () => string | null): Promise<TEntity[]>;
    protected filterResult(result: TEntity[]): TEntity[];
    protected getAllData(getIndex: () => string | null): Promise<import("../types/entity-types").IDbRecordBase[]>;
    protected getKeyFromEntity(entity: TEntity): string;
}
