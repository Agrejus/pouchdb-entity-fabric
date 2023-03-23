import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { IDbRecord, IReferenceDbRecord, OmittedEntity } from "../types/entity-types";
import { DeepOmit } from "../types/common-types";
import { DataContext } from '../context/DataContext';

describe('Reference DbSet Tests', () => {

    PouchDB.plugin(memoryAdapter);

    enum DocumentTypes {
        Computers = "Computers",
    }

    enum ReferenceDocumentTypes {
        Notes = "Notes",
    }

    interface IComputer extends IReferenceDbRecord<DocumentTypes, ReferenceDocumentTypes, INote> {
        name: string;
        cores: number;
        keyboard?: string;
    }

    interface INote extends IDbRecord<ReferenceDocumentTypes> {
        message: string;
        more: string;
    }

    class PouchDbDataContext extends DataContext<DocumentTypes> {

        constructor(name: string) {
            super(name);
        }

        computers = this.referenceDbSet<ReferenceDocumentTypes, INote, IComputer>(DocumentTypes.Computers).create();

    }

    it('', () => {
        const context = new PouchDbDataContext("test");

        context.computers.add({
            cores: 1,
            name: "",
            reference: {
                message: "",
                more: ""
            }
        })
    })

});