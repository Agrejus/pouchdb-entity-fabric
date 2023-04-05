"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttachedEntity = void 0;
const validateAttachedEntity = (entity) => {
    const properties = ["_id", "_rev", "DocumentType"];
    return properties.map(w => {
        const value = entity[w];
        const result = {
            ok: true,
            propertyName: w,
            error: ""
        };
        if (value == null) {
            result.ok = false;
            result.error = `Property cannot be null or undefined.  Property: ${String(w)}, Entity: ${JSON.stringify(entity)}`;
            return result;
        }
        return result;
    });
};
exports.validateAttachedEntity = validateAttachedEntity;
//# sourceMappingURL=Validation.js.map