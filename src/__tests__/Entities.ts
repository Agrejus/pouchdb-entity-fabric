import { IDbRecord, OmittedEntity } from "../typings";
import { DocumentTypes } from "./TestSetup";

export interface ISeedOptions {
    notes?: OmittedEntity<INote>[];
    contacts?: OmittedEntity<IContact>[];
    books?:OmittedEntity<IBook>[];
}

export interface IContact extends IDbRecord<DocumentTypes> {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
}

export interface INote extends IDbRecord<DocumentTypes> {
    contents: string;
    createdDate: Date;
    userId: string;
}

export interface IBook extends IDbRecord<DocumentTypes>  {
    author: string;
    publishDate?: Date;
    rejectedCount: number;
    status: string
}
