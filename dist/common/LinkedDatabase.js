"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocumentReference = exports.isDocumentReference = exports.createDocumentReference = exports._PROTOCOL = void 0;
exports._PROTOCOL = "pouchdb://";
const createDocumentReference = (entity, databaseName) => {
    return `${exports._PROTOCOL}${databaseName}/_id:${encodeURIComponent(entity._id)}`;
};
exports.createDocumentReference = createDocumentReference;
const isDocumentReference = (value) => {
    return (0, exports.parseDocumentReference)(value) != null;
};
exports.isDocumentReference = isDocumentReference;
const parseDocumentReference = (value) => {
    if (value.startsWith(exports._PROTOCOL) === false) {
        return null;
    }
    const protocolSplit = value.split(exports._PROTOCOL);
    if (protocolSplit.length <= 1) {
        return null;
    }
    const [databaseName, selector] = protocolSplit[1].split('/').filter(w => !!w).map(w => decodeURIComponent(w));
    if (!databaseName || !selector) {
        return null;
    }
    const [selectorProperty, selectorValue] = selector.split(':');
    if (!selectorProperty || !selectorValue) {
        return null;
    }
    return {
        databaseName,
        selector: {
            property: selectorProperty,
            value: selectorValue
        }
    };
};
exports.parseDocumentReference = parseDocumentReference;
//# sourceMappingURL=LinkedDatabase.js.map