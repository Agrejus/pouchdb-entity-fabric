import { IExample } from "..";
import { DocumentTypes, PouchDbDataContext } from "./create-data-context"

const run = async () => {
    const context = new PouchDbDataContext();

    await context.empty();

    const [contact] = await context.contacts.add({
        email: "james.demeuse@gmail.com",
        firstName: "James",
        lastName: "DeMeuse",
        phoneNumber: "111-111-1111"
    });

    await context.saveChanges();

    const contacts = await context.contacts.all();

    console.assert(contacts.length > 0, 'Should add and persist one entity');
    console.assert(contact._id != null, 'Should have an id');
    console.assert(contact._rev != null, 'Should have an rev');
    console.assert(contact.DocumentType === DocumentTypes.Contacts, 'Should correct document type');
}

export const example: IExample = {
    run,
    name: "add-entity-to-data-store"
}