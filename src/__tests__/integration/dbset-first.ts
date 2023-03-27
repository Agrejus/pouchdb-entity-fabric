import { BooksWithOneDefaultContext, DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";
import { DocumentTypes } from "../../../test-helpers/types";

describe('DbSet First Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should get first entity', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        await context.contacts.add({
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

        await context.saveChanges();

        const first = await context.contacts.first();

        expect(first!.firstName).toBe("James");
        expect(first!.lastName).toBe("DeMeuse");
        expect(first!.phone).toBe("111-111-1111");
        expect(first!.address).toBe("1234 Test St");
    });

    it('dbset should set defaults after fetch', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new BooksWithOneDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const book = await context.booksWithDefaults.first();

        expect(book?.status).toBe("pending");
        expect(book?.rejectedCount).toBe(0);
        expect(book?.author).toBe("james");
        expect(book?.DocumentType).toBe(DocumentTypes.BooksWithDefaults);
        expect(book?.publishDate).toBe(date.toISOString());
        expect(book?._id).toBeDefined();
        expect(book?._rev).toBeDefined();
    });

    it('dbset should set defaults after fetch - v2', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new BooksWithOneDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithDefaultsV2.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const book = await context.booksWithDefaultsV2.first();

        expect(book?.status).toBe("pending");
        expect(book?.rejectedCount).toBe(0);
        expect(book?.author).toBe("james");
        expect(book?.DocumentType).toBe(DocumentTypes.BooksWithDefaultsV2);
        expect(book?.publishDate).toBe(date.toISOString());
        expect(book?._id).toBeDefined();
        expect(book?._rev).toBeDefined();
    });
});