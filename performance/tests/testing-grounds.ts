import { DataContext } from "../../src/DataContext";
import { DbSetBuilder } from "../../src/DbSetBuilder";
import { IDbRecord, IDbSet } from "../../src/typings";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference"
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
    publishDate?: | string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
}

interface ICar extends IDbRecord<DocumentTypes> {
    make: string;
    model: string;
    year: number;
    manufactureDate: Date;
}

interface IPreference extends IDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}


class PouchDbDataContext extends DataContext<DocumentTypes> {

    constructor() {
        super('test-db', { adapter: 'memory' });
    }

    async empty() {
        for (let dbset of this) {
            await dbset.empty();
        }

        await this.saveChanges();
    }

    books = this.createDbSet<IBook, "status" | "rejectedCount">(DocumentTypes.Books);

    contacts = this.dbset<IContact>(DocumentTypes.Contacts)
        .defaults({ address: "address", firstName: "firstname", lastName: "test" })
        .exclude("address", "firstName", "lastName")
        .keys(w =>
            w.add("firstName")
                .add("lastName")
                .add(w => w.phone.toLocaleLowerCase()))
        .create();
}

class DefaultPropertiesDataContext extends PouchDbDataContext {
    constructor() {
        super();
        this.books.on("add", entity => {
            entity.status = "pending";
        })
    }
}

export const run = async () => {
    try {

        debugger;
        const context = new DefaultPropertiesDataContext();
        const [newBook] = await context.books.add({
            author: "James",
            publishDate: new Date().toDateString()
        });

        const [x] = await context.contacts.add({ phone: "1" })
        debugger;
        await context.saveChanges();

        const book = await context.books.first();

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 