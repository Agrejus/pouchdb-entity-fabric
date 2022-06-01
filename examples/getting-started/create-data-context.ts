import { DataContext } from "../../src/DataContext";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { IContact } from "../entities";

PouchDB.plugin(memoryAdapter);

export enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books"
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    constructor() {
        super('test-db', { adapter: 'memory' });
    }

    contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
}
