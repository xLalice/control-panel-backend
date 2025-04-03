"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortingConfig = getSortingConfig;
function getSortingConfig(sortBy, sortOrder) {
    switch (sortBy) {
        case "companyName":
            return {
                company: {
                    name: sortOrder,
                },
            };
        case "assignedTo":
            return {
                assignedTo: {
                    name: sortOrder,
                },
            };
        case "contactPerson":
        case "status":
        case "lastContactDate":
        case "followUpDate":
        case "leadScore":
        case "industry":
        case "region":
            return {
                [sortBy]: sortOrder,
            };
        default:
            return {
                createdAt: "desc",
            };
    }
}
