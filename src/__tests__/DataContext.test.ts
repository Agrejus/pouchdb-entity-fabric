import PouchDB from 'pouchdb';
import { DataContext } from '../DataContext'; 
import memoryAdapter from 'pouchdb-adapter-memory';

PouchDB.plugin(memoryAdapter);

interface ISeedOptions {
    notes?: INote[];
    contacts?: IContact[];
    books?:IBook[];
}

interface IContact {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
}

interface INote {
    contents: string;
    createdDate: Date;
    userId: string;
}

interface IBook {
    author: string;
    publishDate?: Date;
    rejectedCount: number;
}

export enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books"
}

class PouchDbDataContext extends DataContext<DocumentTypes> {
    constructor() {
        super('test-db', { adapter: 'memory' })
    }

    notes = this.createDbSet<INote>(DocumentTypes.Notes, "userId", "createdDate");
    contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
    books = this.createDbSet<IBook>(DocumentTypes.Books);
}

const seedDb = async (context: PouchDbDataContext, options: ISeedOptions) => {
    await clearDb(context);

    await context.notes.addRange(options.notes ?? []);
    await context.contacts.addRange(options.contacts ?? []);
    await context.books.addRange(options.books ?? []);

    await context.saveChanges();
}

const clearDb = async (context?: PouchDbDataContext) => {
    const c = context ?? createContext();

    for (let dbSet of c) {
        await dbSet.removeAll()
    }

    await c.saveChanges();
}

const createContext = () => {
    return new PouchDbDataContext();
}

describe('DataContext Tests', () => {

    beforeEach(async () => {
        await clearDb();
    });

    it('should seed database', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Some Note", createdDate: new Date(), userId: "jdemeuse" }],
            contacts: [{ address: "1234 Test St", firstName: "James", lastName: "DeMeuse", phone: "111-111-1111" }],
            books: [{ author: "James", rejectedCount: 10 }]
        });

        const notes = await context.notes.toList();
        const contacts = await context.contacts.toList();
        const books = await context.books.toList();

        expect(notes.length).toBe(1);
        expect(contacts.length).toBe(1);
        expect(books.length).toBe(1);
    });

    it('should add range of entities', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: []
        });

        const noteOne: INote = { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }
        const noteTwo: INote = { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }

        const notesBeforeAdd = await context.notes.toList();

        expect(notesBeforeAdd.length).toBe(0);

        await context.notes.addRange([noteOne, noteTwo]);

        await context.saveChanges();

        const notes = await context.notes.toList();
        const contacts = await context.contacts.toList();
        const books = await context.books.toList();

        expect(notes.length).toBe(2);
        expect(contacts.length).toBe(0);
        expect(books.length).toBe(0);
    });

    // it('onBeforeAdd should set sync status', async (done) => {

    //     const context = createContext();
    //     await seedDb(context, {
    //         notes: [{ contents: "Note One", customerid: "noteone", jobid: "noteone", operatorid: "noteone", type: "NOTEONE" }]
    //     });

    //     await context.saveChanges();

    //     const note = await context.notes.firstOrDefault(w => w.customerid == "noteone");

    //     expect(note.SyncStatus).toBe(CollectionSyncStatus.Pending);
    //     done();
    // });

    // it('should remove range of entities', async (done) => {

    //     const context = createContext();
    //     await seedDb(context, {
    //         notes: [
    //             { contents: "Note One", customerid: "noteone", jobid: "noteone", operatorid: "noteone", type: "NOTEONE" },
    //             { contents: "Note Two", customerid: "notetwo", jobid: "notetwo", operatorid: "notetwo", type: "NOTETWO" }
    //         ]
    //     });

    //     let notes = await context.notes.toList();

    //     expect(notes.length).toBe(2);

    //     await context.notes.removeRange(notes);
    //     await context.saveChanges();

    //     notes = await context.notes.toList();

    //     expect(notes.length).toBe(0);
    //     done();
    // });

    it('should remove one entity', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.toList();

        expect(notes.length).toBe(2);

        const itemToRemove = await context.notes.firstOrDefault(w => w.userId === "jdemeuse1");

        await context.notes.removeById(itemToRemove._id)

        await context.saveChanges();

        notes = await context.notes.toList();

        expect(notes.length).toBe(1);
    });

    it('should remove range of entities by id', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.toList();

        expect(notes.length).toBe(2);

        const itemsToRemove = await context.notes.toList();

        await context.notes.removeRangeById(itemsToRemove.map(w => w._id))

        await context.saveChanges();

        notes = await context.notes.toList();

        expect(notes.length).toBe(0);
    });

    it('should change entity by reference', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }]
        });

        const item = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        item.contents = "Updated";

        await context.saveChanges();

        const updated = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        expect(updated.contents).toBe("Updated");
    });

    it('should show no changes when property is the same as start', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }]
        });

        const item = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        item.contents = "Updated";
        item.contents = "Note One";

        const changes = await context.saveChanges();

        const updated = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        expect(updated.contents).toBe("Note One");
        expect(changes).toBe(0);
    });

    it('should match entities and return false', async () => {

        const context = createContext();
        const data = [
            { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
            { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
        ] as INote[];
        const result = context.notes.isMatch(data[0], data[1]);

        expect(result).toBe(false);
    });

    it('should match entities and return true', async () => {

        const context = createContext();
        const data = [
            { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
            { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }
        ] as INote[];
        const result = context.notes.isMatch(data[0], data[1]);

        expect(result).toBe(true);
    });

    it('should detach entities from context reference', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }]
        });

        const item = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        context.notes.detach([item]);

        item.contents = "Updated";

        await context.saveChanges();

        const updated = await context.notes.firstOrDefault(w => w.userId === "jdemeuse");

        expect(updated.contents).toBe("Note One");
    });

    // it('should migrate data', async (done) => {

    //     const seedContext = createContext();
    //     const tickets: ITicket[] = [
    //         { customerid: "customerid", jobid: "jobid" }
    //     ];

    //     await Promise.all(tickets.map(w => saveTicket(seedContext, w)));
    //     await seedContext.migrate();

    //     const allTickets = await seedContext.tickets.toList();

    //     expect(allTickets.length).toEqual(1);
    //     done()
    // });

    // it('should not migrate data if already migrated', async (done) => {

    //     const seedContext = createContext();
    //     const tickets: ITicket[] = [
    //         { customerid: "customerid", jobid: "jobid" }
    //     ];

    //     await Promise.all(tickets.map(w => saveTicket(seedContext, w)));

    //     const firstRun = await seedContext.migrate();
    //     const secondRun = await seedContext.migrate();

    //     const allTickets = await seedContext.tickets.toList();

    //     expect(firstRun).toEqual([ "ticket" ]);
    //     expect(secondRun.length).toBe(0);
    //     expect(allTickets.length).toBe(1)
    //     done()
    // });
});