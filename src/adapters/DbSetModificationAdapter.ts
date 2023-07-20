import { DataContext } from '../context/DataContext';
import { IDbSetIndexAdapter, IDbSetModificationAdapter } from '../types/adapter-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord, OmittedEntity, IIndexableEntity } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {

    protected indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>) {
        super(props);
        this.indexAdapter = indexAdapter;
    }

    protected processAddition(entity: OmittedEntity<TEntity, TExtraExclusions>) {
        const addItem: IDbRecord<TDocumentType> = entity as any;
        (addItem as any).DocumentType = this.documentType;
        const id = this.getKeyFromEntity(entity as any);

        if (id != undefined) {
            (addItem as any)._id = id;
        }

        return addItem
    }

    protected processAdditionAndMakeTrackable(entity: OmittedEntity<TEntity, TExtraExclusions>) {
        const addItem = this.processAddition(entity);

        return this.api.makeTrackable(addItem, this.defaults.add, this.isReadonly, this.map) as TEntity;
    }

    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return entities.map(entity => ({ ...this.processAdditionAndMakeTrackable(entity) }));
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        const data = this.api.getTrackedData();
        const { add } = data;

        const result = entities.map(entity => {
            const indexableEntity: IIndexableEntity = entity as any;

            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            const mappedEntity = this.api.map(entity, this.map, this.defaults.add);
            const trackableEntity = this.processAdditionAndMakeTrackable(mappedEntity);

            add.push(trackableEntity);

            return trackableEntity;
        });

        return result
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]) {
        // build the id's
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        const all = await this.getAllData(getIndex);
        const allDictionary: { [key: string]: TEntity } = all.reduce((a, v) => ({ ...a, [v._id]: v }), {})
        const result: TEntity[] = [];

        for (let entity of entities as any[]) {
            const instance = entity._id != null ? entity as TEntity : { ...this.processAdditionAndMakeTrackable(entity) } as TEntity;
            const found = allDictionary[instance._id]

            if (found) {
                const mergedAndTrackable = this.api.makeTrackable(found, this.defaults.add, this.isReadonly, this.map) as TEntity;

                DataContext.merge(mergedAndTrackable, entity, { skip: [this.api.PRISTINE_ENTITY_KEY] });

                this.api.send([mergedAndTrackable]);
                result.push(mergedAndTrackable)
                continue;
            }

            const [added] = await this.add(entity);

            result.push(added)
        }

        return result;
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {
        
        await this.onRemove();

        if (entities.some(w => typeof w === "string")) {
            await Promise.all(entities.map(w => this._removeById(w)))
            return;
        }

        await Promise.all(entities.map(w => this._remove(w)))
    }

    protected async onRemove() {

    }

    async empty() {
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        const items = await this._all(getIndex);
        await this.remove(...items);
    }

    private async _remove(entity: TEntity) {
        const data = this.api.getTrackedData();
        const { remove } = data;

        const ids = remove.map(w => w._id);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity._id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`)
        }

        remove.push(entity as any);
    }

    protected async _removeById(id: string) {
        const data = this.api.getTrackedData();
        const { removeById } = data;

        if (removeById.includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`)
        }

        removeById.push(id);
    }
}