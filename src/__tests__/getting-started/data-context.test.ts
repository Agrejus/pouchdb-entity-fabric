import { DataContext } from "../../DataContext";
import { IDbRecord } from "../../typings";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';

describe('getting started - data context',  () => {

    PouchDB.plugin(memoryAdapter);

    enum DocumentTypes {
        Notes = "Notes",
        Contacts = "Contacts",
        Books = "Books"
    }

    interface IContact extends IDbRecord<DocumentTypes> {
        firstName: string;
        lastName: string;
        address: string;
        phone: string;
    }
    
    interface INote extends IDbRecord<DocumentTypes> {
        contents: string;
        createdDate: Date;
        userId: string;
    }
    
    interface IBook extends IDbRecord<DocumentTypes>  {
        author: string;
        publishDate?: Date;
        rejectedCount: number;
        status: "pending" | "approved" | "rejected";
    }
    

    class PouchDbDataContext extends DataContext<DocumentTypes> {

        constructor() {
            super('test-db', { adapter: 'memory' });
        }

        async empty() {
            for(let dbset of this) {
                await dbset.empty();
            }
    
            await this.saveChanges();
        }
    
        notes = this.createDbSet<INote>(DocumentTypes.Notes, "userId", "createdDate");
        contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
        books = this.createDbSet<IBook, "status">(DocumentTypes.Books);
    }

    beforeEach(async () => {
        const context = new PouchDbDataContext();
        await context.empty();
    });

    test('should save changes when entity is added', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });
    
        await context.saveChanges();

        const contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(1);
        expect(contact._id).toBeDefined();
        expect(contact._rev).toBeDefined();
        expect(contact.DocumentType).toBe(DocumentTypes.Contacts)
    });

    test('should save changes when more than one entity is added', async () => {

        const context = new PouchDbDataContext();
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "Person",
            phone: "111-111-1111",
            address: "6789 Test St"
        });
    
        await context.saveChanges();

        const contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(2);
        expect(first._id).toBeDefined();
        expect(first._rev).toBeDefined();
        expect(first.DocumentType).toBe(DocumentTypes.Contacts);
        expect(second._id).toBeDefined();
        expect(second._rev).toBeDefined();
        expect(second.DocumentType).toBe(DocumentTypes.Contacts);
    });

    test('should save changes when entity is removed', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });
    
        await context.saveChanges();

        let contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(1);

        await context.contacts.remove(contact);
        await context.saveChanges();

        contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(0);
    });

    test('should save changes when entities are removed', async () => {

        const context = new PouchDbDataContext();
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "6789 Test St"
        });
    
        await context.saveChanges();

        let contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(2);

        await context.contacts.remove(first, second);
        await context.saveChanges();

        contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(0);
    });

    test('should save changes when entities are removed by id', async () => {

        const context = new PouchDbDataContext();
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "6789 Test St"
        });
    
        await context.saveChanges();

        let contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(2);

        await context.contacts.remove(first._id, second._id);
        await context.saveChanges();

        contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(0);
    });

    test('should save changes when entity is updated', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });
    
        await context.saveChanges();

        let contacts = await context.contacts.all();
    
        expect(contacts.length).toBe(1);

        contact.firstName = "Changed"

        await context.saveChanges();

        const updated = await context.contacts.first();
    
        expect(updated.firstName).toBe("Changed");
    });
});