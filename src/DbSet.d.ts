declare interface IDbSet<TDocumentType extends string, TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>> extends IDbSetBase<TDocumentType> {
    add(entity: TEntity): Promise<void>;
    addRange(entities: TEntity[]): Promise<void>;
    remove(entity: TEntity) : Promise<void>;
    removeRange(entities: TEntity[]) : Promise<void>;
    toList(): Promise<(TEntityType & TEntity)[]>;
    filter(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity)[]>;
    firstOrDefault(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean) : Promise<(TEntityType & TEntity) | undefined>
    onBeforeAdd(action: (entity: TEntity & TEntityType) => void): void;
    isMatch(first: TEntity, second: TEntity): boolean;
    detach(entities: TEntity[]): (TEntity & TEntityType)[];
}

declare type KeyOf<T> = keyof T;
declare type IdKeys<T> = KeyOf<T>[];

declare interface IDbSetBase<TDocumentType extends string> {
    get DocumentType(): TDocumentType;
    removeAll(): Promise<void>;
    removeById(id:string): Promise<void>;
    removeRangeById(ids:string[]): Promise<void>;
}