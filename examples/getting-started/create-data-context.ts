import { DataContext } from "../../src/DataContext";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { IContact } from "../entities";
import { IExample } from "..";

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

    async empty() {
        for(let dbset of this) {
            await dbset.empty();
        }

        await this.saveChanges();
    }

    contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
}

const run = async () => {

    // Create your new Context
    const context = new PouchDbDataContext();

    console.assert(context != null)
}

export const example: IExample = {
    run, 
    name: "create-data-context"
}