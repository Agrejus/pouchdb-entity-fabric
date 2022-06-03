import { IDbRecord } from "../src/typings";
import { DocumentTypes } from "./getting-started/create-data-context";

export interface IContact extends IDbRecord<DocumentTypes> {
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    email: string;
}