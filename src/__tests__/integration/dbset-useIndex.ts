import { DbContextFactory, PouchDbDataContext } from "./shared/context";
import { DocumentTypes } from "./shared/types";

describe('DbSet useIndex Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should use index from dbset', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const mockFind = jest.fn(async () => ({ docs: [] }));
        (context as any).doWork = async (action: (db: any) => Promise<any>) => {
            const db = {
                find: mockFind
            }
            const result = await action(db);
            return result;
        }

        const all = await context.books.useIndex("some-index").all();
        const filter = await context.books.useIndex("some-index").filter(w => w.author == "");
        const find = await context.books.useIndex("some-index").find(w => w.author == "");
        const first = await context.books.useIndex("some-index").first();

        expect(mockFind).toHaveBeenNthCalledWith(1, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(2, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(3, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(4, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
    });

    it('should use index from dbset once', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const mockFind = jest.fn(async () => ({ docs: [] }));
        (context as any).doWork = async (action: (db: any) => Promise<any>) => {
            const db = {
                find: mockFind
            }
            const result = await action(db);
            return result;
        }

        const allOne = await context.books.useIndex("some-index").all();
        const allTwo = await context.books.all();

        expect(mockFind).toHaveBeenNthCalledWith(1, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(2, { selector: { DocumentType: DocumentTypes.Books } });
    });

    it('should use index from dbset once, skip, and use again', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const mockFind = jest.fn(async () => ({ docs: [] }));
        (context as any).doWork = async (action: (db: any) => Promise<any>) => {
            const db = {
                find: mockFind
            }
            const result = await action(db);
            return result;
        }

        const allOne = await context.books.useIndex("some-index").all();
        const allTwo = await context.books.all();
        const find = await context.books.useIndex("some-index").find(w => w.author == "");

        expect(mockFind).toHaveBeenNthCalledWith(1, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(2, { selector: { DocumentType: DocumentTypes.Books } });
        expect(mockFind).toHaveBeenNthCalledWith(3, { selector: { DocumentType: DocumentTypes.Books }, use_index: "some-index" });
    });

    it('should use index from dbset fluent api', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const mockFind = jest.fn(async () => ({ docs: [] }));
        (context as any).doWork = async (action: (db: any) => Promise<any>) => {
            const db = {
                find: mockFind
            }
            const result = await action(db);
            return result;
        }

        const all = await context.booksWithIndex.all();
        const filter = await context.booksWithIndex.filter(w => w.author == "");
        const find = await context.booksWithIndex.find(w => w.author == "");
        const first = await context.booksWithIndex.first();

        expect(mockFind).toHaveBeenNthCalledWith(1, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-default-index" });
        expect(mockFind).toHaveBeenNthCalledWith(2, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-default-index" });
        expect(mockFind).toHaveBeenNthCalledWith(3, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-default-index" });
        expect(mockFind).toHaveBeenNthCalledWith(4, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-default-index" });
    });

    it('should use temp index over the default index', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const mockFind = jest.fn(async () => ({ docs: [] }));
        (context as any).doWork = async (action: (db: any) => Promise<any>) => {
            const db = {
                find: mockFind
            }
            const result = await action(db);
            return result;
        }

        const allOne = await context.booksWithIndex.useIndex("some-index").all();
        const allTwo = await context.booksWithIndex.all();
        const find = await context.booksWithIndex.useIndex("some-index").find(w => w.author == "");

        expect(mockFind).toHaveBeenNthCalledWith(1, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-index" });
        expect(mockFind).toHaveBeenNthCalledWith(2, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-default-index" });
        expect(mockFind).toHaveBeenNthCalledWith(3, { selector: { DocumentType: DocumentTypes.BooksWithIndex }, use_index: "some-index" });
    });
});