import { DbSetKeyType, PropertyMap } from '../DbSetBuilder';
import { DbSetPickDefaultActionRequired, DocumentKeySelector, EntityIdKeys, IDbRecord, IDbSetApi, IDbSetProps, IIndexableEntity, IPrivateContext } from '../typings';
import { v4 as uuidv4 } from 'uuid';
import { IndexStore } from '../IndexStore';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> {

    protected indexStore: IndexStore;
    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    protected idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType>;
    protected api: IDbSetApi<TDocumentType>;
    protected isReadonly: boolean;
    protected keyType: DbSetKeyType;
    protected map: PropertyMap<TDocumentType, TEntity, any>[];
    protected isReferenceDbSet: boolean;

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        this.documentType = props.documentType;
        this.context = props.context as IPrivateContext<TDocumentType>;
        this.idKeys = props.idKeys;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.keyType = props.keyType;
        this.map = props.map;
        this.isReferenceDbSet = props.isRefrenceDbSet

        this.api = this.context._getApi();
        this.indexStore = new IndexStore(props.index);
    }

    protected async allDataAndMakeTrackable() {
        const data = await this.getAllData();

        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        return data.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map) as TEntity);
    }

    async all() {
        const result = await this.allDataAndMakeTrackable();

        this.api.send(result);

        return result;
    }

    protected async getAllData() {
        const index = this.indexStore.get();
        return await this.api.getAllData({
            documentType: this.documentType,
            index
        });
    }

    protected getKeyFromEntity(entity: TEntity) {

        if (this.keyType === 'auto') {
            return uuidv4();
        }

        if (this.keyType === 'none') {
            return this.documentType;
        }

        // user defined key
        const indexableEntity = entity as IIndexableEntity

        const keyData = this.idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }

            const selector: DocumentKeySelector<TEntity> = w as any;

            return String(selector(entity));
        });

        return [this.documentType, ...keyData].join("/");
    }
}