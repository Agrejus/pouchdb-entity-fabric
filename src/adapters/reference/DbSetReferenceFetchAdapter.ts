import PouchDB from 'pouchdb';
import { IDbSetProps, IncludeType } from '../../types/dbset-types';
import { IDbRecord, IDbRecordBase, SplitDocumentPathPropertyName } from '../../types/entity-types';
import { DbSetFetchAdapter } from '../DbSetFetchAdapter';
import { IDbSetFetchAdapter, IDbSetIndexAdapter } from '../../types/adapter-types';
import { parseDocumentReference } from '../../common/LinkedDatabase';
import { DocumentReference } from '../../types/common-types';

export class DbSetReferenceFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>  {

    private _include: IncludeType = "all";

    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>) {
        super(props, indexAdapter);
    }

    private async _getMany(databaseName: string, fields: IncludeType, ...ids: string[]) {
        const database = new PouchDB(databaseName);

        const request: PouchDB.Find.FindRequest<{}> = {
            selector: { _id: { $in: ids } }
        }

        if (fields !== "all" && fields.length > 0) {
            request.fields = ["_id", "_rev", "DocumentType", ...fields]
        }

        const response = await database.find(request);

        return response.docs as IDbRecordBase[];
    }

    setLazy() {
        this._include = [];
    }

    setInclude(...properties: string[]) {
        this._include = properties;
    }

    protected override async onAfterDataFetched(data: TEntity[]) {

        if (this._include.length === 0) {
            this._include = "all";
            return;
        }

        const documentsWithReferences = data.filter(w => !!(w as any)[SplitDocumentPathPropertyName]);
        const documentReferenceMap: { [key: string]: DocumentReference } = {};
        const referenceModifications: { [key: string]: string[] } = {};
        const referenceIdToMainIdLinks: { [key: string]: IDbRecordBase & { reference: any } } = {}

        for (const entity of documentsWithReferences) {
            const castedItem = (entity as any);
            const referencePath = castedItem[SplitDocumentPathPropertyName] as string;
            const reference = parseDocumentReference(referencePath);

            if (referenceModifications[reference.databaseName] == null) {
                referenceModifications[reference.databaseName] = []
            }

            referenceModifications[reference.databaseName].push(reference.selector.value)

            documentReferenceMap[entity._id] = reference;

            referenceIdToMainIdLinks[reference.selector.value] = entity as any;
        }

        const mods: { databaseName: string, ids: string[] }[] = [];
        for (const referenceModification in referenceModifications) {
            mods.push({ databaseName: referenceModification, ids: referenceModifications[referenceModification] })
        }

        const referencedDocuments = await Promise.all(mods.map(async w => await this._getMany(w.databaseName, this._include, ...w.ids)))
        for (const referencedDocument of referencedDocuments.reduce((a, v) => a.concat(v), [])) {
            referenceIdToMainIdLinks[referencedDocument._id].reference = referencedDocument;
            this.api.makePristine(referenceIdToMainIdLinks[referencedDocument._id]);
        }

        this._include = [];
    }
}