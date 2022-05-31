import { DataContext } from '../DataContext'; 
import { IBook, IContact, INote, ISeedOptions } from './Entities';

export enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books"
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    constructor() {
        super('test-db', { adapter: 'memory' })
    }

    notes = this.createDbSet<INote>(DocumentTypes.Notes, "userId", "createdDate");
    contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
    books = this.createDbSet<IBook>(DocumentTypes.Books);
}

export const seedDb = async (context: PouchDbDataContext, options: ISeedOptions) => {
    await clearDb(context);

    await context.notes.addRange(options.notes ?? []);
    await context.contacts.addRange(options.contacts ?? []);
    await context.books.addRange(options.books ?? []);

    await context.saveChanges();
}

export const clearDb = async (context?: PouchDbDataContext) => {
    const c = context ?? createContext();

    for (let dbSet of c) {
        await dbSet.removeAll()
    }

    await c.saveChanges();
}

export const createContext = () => {
    return new PouchDbDataContext();
}