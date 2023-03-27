import PouchDB from 'pouchdb';
import findAdapter from 'pouchdb-find';

PouchDB.plugin(findAdapter);


import { DbSetKeyType, PropertyMap } from '../context/dbset/DbSetBuilder';
import { v4 as uuidv4 } from 'uuid';
import { EntityIdKeys, IDbRecord, IIndexableEntity } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, DocumentKeySelector, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { IDbSetApi, IDbSetProps } from '../types/dbset-types';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {

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
        this.isReferenceDbSet = props.isSplitDbSet

        this.api = this.context._getApi();
    }

    protected async allDataAndMakeTrackable(getIndex: () => string | null) {
        const data = await this.getAllData(getIndex);

        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        return data.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map) as TEntity);
    }

    protected async convertFilterSelector(selector: EntitySelector<TDocumentType, TEntity>) {
        try {
            const stringifiedSelector = selector.toString();
            const [variable, selectorFunction] = stringifiedSelector.split('=>').map(w => w.trim());

            // find the first match, replace it with a group number, try and get all parent splits and go from there
            // \(.{1,}?\)
            /*

            Test Data
            w._id === "" && (w.DocumentType === DocumentTypes.Books || w.author === "James" || (w.status === "approved" || w.author === "Megan")) && (w.DocumentType === DocumentTypes.Books || w.author === "James")
                OR
            id === 1 && test == 2 && (test === 3) && (win === 1)

            */
            const testSplit = selectorFunction.split(/()|()/g)
            const cleanse = selectorFunction.replace(/\s+/g, ' ').replace(/\r/g, '').replace(/\n/g, '').replace(/\t/g, ' ')
            const matches = cleanse.match(/\(.{1,}\)/g);
            let result = cleanse;

            for (let i = 0; i < result.length; i++) {
                const match = matches[i];
                result = result.replace(match, `__MATCH-${i}__`)

            }
            console.log(result);
            //w => w._id === "" && (w.DocumentType === DocumentTypes.Books || w.author === "James")

            // selector: {
            //     $and: [
            //         { rejectedCount: 1 },
            //         {
            //             $or: [
            //                 { DocumentType: { $eq: "Books" } },
            //                 { author: { $eq: "James" } }
            //             ]
            //         }
            //     ]
            // }

            //console.log(test)
        } catch (e: any) {
            console.error(e);
        }
    }

    protected async onAfterDataFetched(data: TEntity[]) {

    }

    protected async _all(getIndex: () => string | null) {
        const result = await this.allDataAndMakeTrackable(getIndex);

        await this.onAfterDataFetched(result);

        this.api.send(result);

        return result;
    }

    protected async getAllData(getIndex: () => string | null) {
        const index = getIndex();
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