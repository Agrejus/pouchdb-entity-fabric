import { DocumentReference, PouchDbLinkProtocol, PouchDbReference } from "../types/common-types";
import { IDbRecordBase } from "../types/entity-types";

export const _PROTOCOL: PouchDbLinkProtocol = "pouchdb://";

export const createDocumentReference = <T extends IDbRecordBase>(entity: T, databaseName: string): PouchDbReference => {
    return `${_PROTOCOL}${databaseName}/_id:${encodeURIComponent(entity._id)}`
}

export const isDocumentReference = (value: string) => {
    return parseDocumentReference(value) != null
}

export const parseDocumentReference = (value: string): DocumentReference | null => {
    if (value.startsWith(_PROTOCOL) === false) {
        return null
    }

    const protocolSplit = value.split(_PROTOCOL);

    if (protocolSplit.length <= 1) {
        return null
    }

    const [databaseName, selector] = protocolSplit[1].split('/').filter(w => !!w).map(w => decodeURIComponent(w));

    if (!databaseName || !selector) {
        return null
    }

    const [selectorProperty, selectorValue] = selector.split(':');

    if (!selectorProperty || !selectorValue) {
        return null
    }

    return {
        databaseName,
        selector: {
            property: selectorProperty,
            value: selectorValue
        }
    }
}