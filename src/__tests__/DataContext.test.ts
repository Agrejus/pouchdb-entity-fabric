import PouchDB from 'pouchdb';
import { clearDb, createContext, seedDb } from './TestSetup'
import memoryAdapter from 'pouchdb-adapter-memory';

PouchDB.plugin(memoryAdapter);

describe('DataContext Tests', () => {

    beforeEach(async () => {
        await clearDb();
    });

    it('should save changes', async () => {
        const context = createContext();

        for (let dbSet of context) {
            await dbSet.removeAll()
        }

        await context.notes.addRange([
            { contents: "contents", createdDate: new Date(), userId: 'jdemeuse' }
        ]);

        await context.contacts.addRange([
            { address: "1234 Test St", firstName: "James", lastName: "DeMeuse", phone: "111-111-1111" }
        ]);

        await context.books.addRange([
            { author: "James DeMeuse", rejectedCount: 1 }
        ]);

        await context.saveChanges();

        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(1);
        expect(contacts.length).toBe(1);
        expect(books.length).toBe(1);
    })

    it('should seed database', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Some Note", createdDate: new Date(), userId: "jdemeuse" }],
            contacts: [{ address: "1234 Test St", firstName: "James", lastName: "DeMeuse", phone: "111-111-1111" }],
            books: [{ author: "James", rejectedCount: 10 }]
        });

        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(1);
        expect(contacts.length).toBe(1);
        expect(books.length).toBe(1);
    });

    it('should add of entity', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }]
        });

        const note: INote = { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }

        const notesBeforeAdd = await context.notes.all();

        expect(notesBeforeAdd.length).toBe(1);

        await context.notes.add(note);

        await context.saveChanges();

        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(2);
        expect(contacts.length).toBe(0);
        expect(books.length).toBe(0);
    });

    it('should add entities with a generated ids', async () => {

        const context = createContext();
        const bookOne: IBook = { author: "James DeMeuse", rejectedCount: 1 };
        const bookTwo: IBook = { author: "Agrejus", rejectedCount: 2 };

        await context.books.add(bookOne);
        await context.books.add(bookTwo);

        await context.saveChanges();

        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(0);
        expect(contacts.length).toBe(0);
        expect(books.length).toBe(2);

        const agrejusBook = books.find(w => w.author === bookOne.author);
        const jamesDeMeuseBook = books.find(w => w.author === bookTwo.author);
        expect((bookOne as any)._id).toBe(agrejusBook._id)
        expect((bookTwo as any)._id).toBe(jamesDeMeuseBook._id)
    });

    it('should add entities without a generated ids', async () => {

        const context = createContext();
        const noteOne: INote = { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" };
        const noteTwo: INote = { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" };

        await context.notes.add(noteOne);
        await context.notes.add(noteTwo);

        await context.saveChanges();
        debugger;
        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(2);
        expect(contacts.length).toBe(0);
        expect(books.length).toBe(0);

        const saveNoteOne = notes.find(w => w.userId === noteOne.userId);
        const saveNoteTwo = notes.find(w => w.userId === noteTwo.userId);
        expect((noteOne as any)._id).toBe(saveNoteOne._id)
        expect((noteTwo as any)._id).toBe(saveNoteTwo._id)
    });

    it('should add range of entities', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: []
        });

        const noteOne: INote = { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }
        const noteTwo: INote = { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }

        const notesBeforeAdd = await context.notes.all();

        expect(notesBeforeAdd.length).toBe(0);

        await context.notes.addRange([noteOne, noteTwo]);

        await context.saveChanges();

        const notes = await context.notes.all();
        const contacts = await context.contacts.all();
        const books = await context.books.all();

        expect(notes.length).toBe(2);
        expect(contacts.length).toBe(0);
        expect(books.length).toBe(0);
    });

    it('should get all data', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Some Note", createdDate: new Date(), userId: "jdemeuse" }],
            contacts: [{ address: "1234 Test St", firstName: "James", lastName: "DeMeuse", phone: "111-111-1111" }],
            books: [{ author: "James", rejectedCount: 10 }]
        });

        const all = await context.getAllDocs();

        expect(all.length).toBe(3);
    });

    it('onBeforeAdd should set sync status', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: []
        });

        context.notes.onBeforeAdd(entity => {
            (entity as any)._id = "ONE";
        })

        context.notes.add({ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" });

        await context.saveChanges();

        const note = await context.notes.find(w => w.userId == "jdemeuse");

        expect(note._id).toBe("ONE");
    });

    it('should remove one entity', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.all();

        expect(notes.length).toBe(2);

        const itemToRemove = await context.notes.find(w => w.userId === "jdemeuse1");

        await context.notes.remove(itemToRemove)

        await context.saveChanges();

        notes = await context.notes.all();

        expect(notes.length).toBe(1);
        expect(notes[0].userId).toBe("jdemeuse");
    });

    it('should remove range of entities', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.all();

        expect(notes.length).toBe(2);

        const itemToRemove = await context.notes.all();

        await context.notes.removeRange(itemToRemove)

        await context.saveChanges();

        notes = await context.notes.all();

        expect(notes.length).toBe(0);
    });

    it('should remove one entity by id', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.all();

        expect(notes.length).toBe(2);

        const itemToRemove = await context.notes.find(w => w.userId === "jdemeuse1");

        await context.notes.removeById(itemToRemove._id)

        await context.saveChanges();

        notes = await context.notes.all();

        expect(notes.length).toBe(1);
        expect(notes[0].userId).toBe("jdemeuse");
    });

    it('should remove range of entities by id', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [
                { contents: "Note One", createdDate: new Date(), userId: "jdemeuse" },
                { contents: "Note Two", createdDate: new Date(), userId: "jdemeuse1" }
            ]
        });

        let notes = await context.notes.all();

        expect(notes.length).toBe(2);

        const itemsToRemove = await context.notes.all();

        await context.notes.removeRangeById(itemsToRemove.map(w => w._id))

        await context.saveChanges();

        notes = await context.notes.all();

        expect(notes.length).toBe(0);
    });

    it('should change entity by reference', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }]
        });

        const item = await context.notes.find(w => w.userId === "jdemeuse");

        item.contents = "Updated";

        await context.saveChanges();

        const updated = await context.notes.find(w => w.userId === "jdemeuse");

        expect(updated.contents).toBe("Updated");
    });

    it('should show no changes when property is the same as start', async () => {

        const context = createContext();
        await seedDb(context, {
            notes: [{ contents: "Note One", createdDate: new Date(), userId: "jdemeuse" }]
        });

        const item = await context.notes.find(w => w.userId === "jdemeuse");

        item.contents = "Updated";
        item.contents = "Note One";

        const changes = await context.saveChanges();

        const updated = await context.notes.find(w => w.userId === "jdemeuse");

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

        const item = await context.notes.find(w => w.userId === "jdemeuse");

        context.notes.detach([item]);

        item.contents = "Updated";

        await context.saveChanges();

        const updated = await context.notes.find(w => w.userId === "jdemeuse");

        expect(updated.contents).toBe("Note One");
    });
});