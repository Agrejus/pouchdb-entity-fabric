import { DocumentReference, PouchDbLinkProtocol, PouchDbReference } from "../types/common-types";
import { IDbRecordBase } from "../types/entity-types";
export declare const _PROTOCOL: PouchDbLinkProtocol;
export declare const createDocumentReference: <T extends IDbRecordBase>(entity: T, databaseName: string) => PouchDbReference;
export declare const isDocumentReference: (value: string) => boolean;
export declare const parseDocumentReference: (value: string) => DocumentReference | null;
