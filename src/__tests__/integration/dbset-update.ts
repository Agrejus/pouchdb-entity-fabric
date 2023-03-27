import { DataContext } from "../../context/DataContext";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Update Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should update an entity with previous rev', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
        const [newBook] = await context.books.add({
            author: "James",
            publishDate: new Date()
        });


        await context.saveChanges();

        expect(newBook._rev).toBeDefined();

        const book = await context.books.first();

        context.books.unlink(book!);

        const secondBook = await context.books.first();
        secondBook!.author = "DeMeuse"
        await context.saveChanges();

        const secondaryContext = contextFactory.createContext(PouchDbDataContext, dbname);
        const [linkedBook] = await secondaryContext.books.link(book!);

        linkedBook.author = "James DeMeuse";
        await secondaryContext.saveChanges();

        expect(linkedBook._rev.startsWith("3")).toBe(true)
    });

    it('should should add and update in one transaction', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
        debugger;
        const all = await context.contacts.all();

        expect(all.length).toBe(0);
        debugger;
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

        const [two, three] = await context.contacts.upsert({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "333-333-3333",
            address: "0000 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const foundAll = await context.contacts.all();

        expect(foundAll.find(w => w._id === two._id)).toEqual(two);
        expect(foundAll.find(w => w._id === three._id)).toEqual(three);

        expect(DataContext.isProxy(one)).toBe(true);
        expect(DataContext.isProxy(two)).toBe(true);
        expect(DataContext.isProxy(three)).toBe(true);
    });
});