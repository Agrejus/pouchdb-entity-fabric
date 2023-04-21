import { DataContext } from "../../context/DataContext";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Upsert Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should should upsert one entity', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const all = await context.contacts.all();

        expect(all.length).toBe(0);

        const [one] = await context.contacts.upsert({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const [foundOne] = await context.contacts.all();

        expect(foundOne).toEqual(one);

        const [two] = await context.contacts.upsert({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const [foundTwo] = await context.contacts.all();

        expect(foundTwo).toEqual(two);

        expect(DataContext.isProxy(one)).toBe(true);
        expect(DataContext.isProxy(two)).toBe(true)
    });


    it('should should upsert one entity using spread not the instance with optional property', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const all = await context.books.all();

        expect(all.length).toBe(0);

        const [one] = await context.books.add({
            author: "me"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        await context.books.upsert({
            ...one,
            publishDate: new Date()
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
    });

    it('should should upsert one entity using spread not the instance with optional property and show no changes', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const all = await context.computers.all();

        expect(all.length).toBe(0);

        const [one] = await context.computers.add({
            cores: 4,
            name: "test",
            keyboard: "something"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        await context.computers.upsert({
            ...one,
            keyboard: "something"
        });

        expect(context.hasPendingChanges()).toBe(false);
    });

    it('should should upsert one entity using spread not the instance with optional date and show no changes', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const all = await context.books.all();

        expect(all.length).toBe(0);

        const [one] = await context.books.add({
            author: "me",
            publishDate: new Date()
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        await context.books.upsert({
            ...one,
            publishDate: new Date()
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
    });

    it('should upsert with auto generated id', async () => {

        try {
            const dbname = contextFactory.getRandomDbName()
            const context = contextFactory.createContext(PouchDbDataContext, dbname);

            const all = await context.notesWithMapping.all();

            expect(all.length).toBe(0);

            const [one] = await context.notesWithMapping.upsert({
                contents: "some contents",
                createdDate: new Date(),
                userId: "some user"
            });

            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const [two] = await context.notesWithMapping.upsert({
                contents: "some contents",
                createdDate: new Date(),
                userId: "some user"
            });

            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const allAfterAdd = await context.notesWithMapping.all();
            expect(allAfterAdd.length).toBe(2);

            const foundOne = await context.notesWithMapping.find(w => w._id === one._id);

            expect(foundOne).toBeDefined();

            const [upsertedOne] = await context.notesWithMapping.upsert({
                _id: one._id,
                contents: "changed contents",
                createdDate: new Date(),
                userId: "changed user"
            });

            expect(upsertedOne._id).toBe(one._id);
            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const foundUpsertOne = await context.notesWithMapping.find(w => w._id === one._id);

            expect({ ...upsertedOne, createdDate: upsertedOne.createdDate }).toEqual({ ...foundUpsertOne });
            expect(foundUpsertOne?.contents).toBe("changed contents");
            expect(foundUpsertOne?.userId).toBe("changed user");
        } catch (e) {
            expect(e).not.toBeDefined()
        }
    });
});