import { DataContext } from "../DataContext";
import { IDbRecord } from "../typings";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';

describe('getting started - data context', () => {

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

    interface IBook extends IDbRecord<DocumentTypes> {
        author: string;
        publishDate?: Date;
        rejectedCount: number;
        status: "pending" | "approved" | "rejected";
    }


    class PouchDbDataContext extends DataContext<DocumentTypes> {

        constructor() {
            super('test-db', { adapter: 'memory' } );
        }

        async empty() {
            for (let dbset of this) {
                await dbset.empty();
            }

            await this.saveChanges();
        }

        notes = this.createDbSet<INote>(DocumentTypes.Notes);
        contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
        books = this.createDbSet<IBook, "status">(DocumentTypes.Books);
    }

    beforeEach(async () => {
        const context = new PouchDbDataContext();
        await context.empty();
    });

    test('should save changes when entity is added and a non auto generated id', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);
        expect(contact._id).toBeDefined();
        expect(contact._rev).toBeDefined();
        expect(contact.DocumentType).toBe(DocumentTypes.Contacts)
    });

    test('should save changes when entities are added and a non auto generated id', async () => {

        const context = new PouchDbDataContext();

        const [one, two] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        expect(contacts.length).toBe(2);
        expect(one._id).toBeDefined();
        expect(one._rev).toBeDefined();
        expect(one.DocumentType).toBe(DocumentTypes.Contacts);

        expect(two._id).toBeDefined();
        expect(two._rev).toBeDefined();
        expect(two.DocumentType).toBe(DocumentTypes.Contacts);
    });

    test('should add entity with auto generated id', async () => {
        const context = new PouchDbDataContext();
        const [note] = await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const notes = await context.notes.all();

        expect(notes.length).toBe(1);

        expect(note._id).toBeDefined();
        expect(note._rev).toBeDefined();
        expect(note.DocumentType).toBeDefined();
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

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

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

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        await context.contacts.remove(contact);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

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

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(2);

        await context.contacts.remove(first, second);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

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

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(2);

        await context.contacts.remove(first._id, second._id);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

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

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        contact.firstName = "Changed";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const updated = await context.contacts.all();

        expect(updated.length).toBe(1);
        expect(updated[0].firstName).toBe("Changed");
    });

    test('should show no changes when property is set to same value', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        contact.firstName = "Changed";
        contact.firstName = "James";

        expect(context.hasPendingChanges()).toBe(false);
    });

    test('should save changes when two of the same entities with different references are updated', async () => {

        const context = new PouchDbDataContext();
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        contact.firstName = "Changed";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const updated = await context.contacts.all();

        expect(updated.length).toBe(1);
        expect(updated[0].firstName).toBe("Changed");

        const [change] = updated;

        change.firstName = "Next";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const last = await context.contacts.all();

        expect(last.length).toBe(1);
        expect(last[0].firstName).toBe("Next");
    });

    it('should get all data', async () => {

        const context = new PouchDbDataContext();

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        await context.books.add({
            author: "James DeMeuse",
            rejectedCount: 1,
            publishDate: new Date()
        })

        expect(context.hasPendingChanges()).toBe(true);

        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const all = await context.getAllDocs();

        expect(all.length).toBe(3);
    });

    it('should on entity created event', async () => {

        const context = new PouchDbDataContext();
        const onEntityCreatedMock = jest.fn();
        const onEntityRemovedMock = jest.fn();
        const onEntityUpdatedMock = jest.fn();

        context.on("entity-created", onEntityCreatedMock);
        context.on("entity-removed", onEntityRemovedMock);
        context.on("entity-updated", onEntityUpdatedMock);

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        await context.books.add({
            author: "James DeMeuse",
            rejectedCount: 1,
            publishDate: new Date()
        })

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
        expect(onEntityCreatedMock).toHaveBeenCalledTimes(3);
        expect(onEntityRemovedMock).toHaveBeenCalledTimes(0);
        expect(onEntityUpdatedMock).toHaveBeenCalledTimes(0);
    });

    it('should on entity updated event', async () => {

        const context = new PouchDbDataContext();
        const onEntityCreatedMock = jest.fn();
        const onEntityRemovedMock = jest.fn();
        const onEntityUpdatedMock = jest.fn();

        context.on("entity-created", onEntityCreatedMock);
        context.on("entity-removed", onEntityRemovedMock);
        context.on("entity-updated", onEntityUpdatedMock);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        const [note] = await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        const [book] = await context.books.add({
            author: "James DeMeuse",
            rejectedCount: 1,
            publishDate: new Date()
        })

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        contact.firstName = "Updated";
        note.contents = "Updated";
        book.rejectedCount += 1;

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
        expect(onEntityCreatedMock).toHaveBeenCalledTimes(3);
        expect(onEntityRemovedMock).toHaveBeenCalledTimes(0);
        expect(onEntityUpdatedMock).toHaveBeenCalledTimes(3);
    });

    it('should on entity removed event', async () => {

        const context = new PouchDbDataContext();
        const onEntityCreatedMock = jest.fn();
        const onEntityRemovedMock = jest.fn();
        const onEntityUpdatedMock = jest.fn();

        context.on("entity-created", onEntityCreatedMock);
        context.on("entity-removed", onEntityRemovedMock);
        context.on("entity-updated", onEntityUpdatedMock);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        const [note] = await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        const [book] = await context.books.add({
            author: "James DeMeuse",
            rejectedCount: 1,
            publishDate: new Date()
        })

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        contact.firstName = "Updated";
        note.contents = "Updated";
        book.rejectedCount += 1;
        await context.books.remove(book);
        await context.contacts.remove(contact);
        await context.notes.remove(note);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
        expect(onEntityCreatedMock).toHaveBeenCalledTimes(3);
        expect(onEntityRemovedMock).toHaveBeenCalledTimes(3);
        expect(onEntityUpdatedMock).toHaveBeenCalledTimes(3);
    });

    it('should iterate over dbsets', async () => {
        const interation = jest.fn();
        const context = new PouchDbDataContext();

        for (let dbset of context) {
            interation();
        }

        expect(interation).toHaveBeenCalledTimes(3);
    });

    // Should create index

});