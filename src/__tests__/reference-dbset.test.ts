import { DataContext } from "../DataContext";
import { IDbRecord, IDbRecordBase, IDbSet, IReferenceDbRecord } from "../typings";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { DbSetBuilder } from "../DbSetBuilder";


describe('Reference DbSet Tests', () => {

    PouchDB.plugin(memoryAdapter);

    enum DocumentTypes {
        Computers = "Computers",
    }

    enum ReferenceDocumentTypes {
        Notes = "Notes",
    }

    interface IComputer extends IReferenceDbRecord<DocumentTypes, ReferenceDocumentTypes, "s", INote> {
        name: string;
        cores: number;
        keyboard?: string;
    }

    interface INote extends IDbRecord<ReferenceDocumentTypes> {
        message: string;
    }

    class PouchDbDataContext extends DataContext<DocumentTypes> {

        constructor(name: string) {
            super(name);
        }

        test: IComputer = {
            reference: {
                _id
            }
        }
        computers = this.referenceDbSet<ReferenceDocumentTypes, INote, IComputer>(DocumentTypes.Computers).create();

    }

    it('', () => {
        const context = new PouchDbDataContext("test");

        context.computers.add({
            cores: 1,
            name: "",
            reference: {

            }
        })
    })

});