import { shouldFilterEntitiesWithDefaults, shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery } from "./shared/common-tests";
import { DbContextFactory, PouchDbDataContext, BooksWithOneDefaultContext } from "./shared/context";
import { DocumentTypes } from "./shared/types";

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

    it('should find first entities with no defaults', async () => {

        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("", "my-db0"),
            async (dbSet, _) => { const response = await dbSet.first(); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1))
    });

    it('should find first entities with defaults', async () => {

        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("CouchDB", "my-db"),
            async (dbSet, _) => { const response = await dbSet.first(); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1))
    });

    it('should find first entities and not find result when base filter does not match - with default', async () => {

        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("CouchDB", "my-db1"),
            () => contextFactory.createContextWithParams("", "my-db1"),
            async (dbSet, _) => { const response = await dbSet.first(); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });

    it('should find first entities and not find result when base filter does not match - with no default', async () => {

        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("", "my-db2"),
            () => contextFactory.createContextWithParams("CouchDB", "my-db2"),
            async (dbSet, _) => { const response = await dbSet.first(); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });
});