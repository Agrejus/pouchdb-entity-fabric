import { DbSet } from "./DbSet";
import { DbSetEvent, DbSetEventCallback, DbSetIdOnlyEventCallback, DeepPartial, EntityIdKey, EntityIdKeys, IDataContext, IDbRecord, IDbSet, OmittedEntity } from "./typings";

interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {
    context: IDataContext;
    documentType: TDocumentType;
    idKeys?: EntityIdKeys<TDocumentType, TEntity>;
    defaults?: DeepPartial<OmittedEntity<TEntity>>;
    exclusions?: (keyof TEntity)[];
    events?: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };
}

export class DbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {

    private _context: IDataContext;
    private _documentType: TDocumentType;
    private _idKeys: EntityIdKeys<TDocumentType, TEntity> = [];
    private _defaults: DeepPartial<OmittedEntity<TEntity>> = {} as any;
    private _exclusions?: (keyof TEntity)[];
    private _events: { [key in DbSetEvent]: (DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback)[] };

    constructor(params: IDbSetBuilderParams<TDocumentType, TEntity, TExtraExclusions>) {

        const { context, documentType, idKeys, defaults, exclusions, events } = params;
        this._documentType = documentType;
        this._context = context;
        this._idKeys = idKeys;
        this._defaults = defaults;
        this._exclusions = exclusions;
        this._events = events ?? {
            "add": [],
            "remove": []
        };
    }

    private _buildParams<T extends (keyof TEntity) = never>() {
        return {
            context: this._context,
            documentType: this._documentType,
            defaults: this._defaults,
            events: this._events,
            exclusions: this._exclusions,
            idKeys: this._idKeys
        } as IDbSetBuilderParams<TDocumentType, TEntity, T>
    }

    keys(builder: (b: IIdBuilder<TDocumentType, TEntity>) => IIdBuilder<TDocumentType, TEntity>) {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._idKeys = idBuilder.Ids;
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._buildParams());
    }

    defaults(defaultEntity: DeepPartial<OmittedEntity<TEntity>>) {
        this._defaults = defaultEntity;
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._buildParams());
    }

    exclude<T extends (keyof TEntity)>(...exclusions: T[]) {
        this._exclusions = exclusions;
        return new DbSetBuilder<TDocumentType, TEntity, T>(this._buildParams<T>());
    }

    on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    on(event: DbSetEvent, callback: DbSetEventCallback<TDocumentType, TEntity>) {
        this._events[event].push(callback);
        return new DbSetBuilder<TDocumentType, TEntity, TExtraExclusions>(this._buildParams());
    }

    create<TExtension extends {}>(extend: (dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions>) => IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension = w => w as IDbSet<TDocumentType, TEntity, TExtraExclusions> & TExtension) {

        debugger;
        const dbset: IDbSet<TDocumentType, TEntity, TExtraExclusions> = new DbSet<TDocumentType, TEntity, TExtraExclusions>(this._documentType, this._context, this._defaults, ...this._idKeys);

        return extend(dbset);
    }
}

interface IIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    add(key: EntityIdKey<TDocumentType, TEntity>): IIdBuilder<TDocumentType, TEntity>
}

class IdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IIdBuilder<TDocumentType, TEntity> {

    private _ids: EntityIdKeys<TDocumentType, TEntity> = [];

    get Ids() {
        return this._ids;
    }

    add(key: EntityIdKey<TDocumentType, TEntity>) {
        this._ids.push(key);
        return this;
    }
}