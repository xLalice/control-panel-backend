"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoleMiddleware = createRoleMiddleware;
const prisma_1 = require("../config/prisma");
let ROLE_PERMISSIONS = {};
function loadPermissions() {
    return __awaiter(this, void 0, void 0, function* () {
        const roles = yield prisma_1.prisma.role.findMany({
            select: { name: true, permissions: true },
        });
        roles.forEach((role) => {
            // Normalize permissions to uppercase
            ROLE_PERMISSIONS[role.name] = role.permissions.map((p) => p.toUpperCase());
        });
    });
}
loadPermissions().then(() => console.log("Permissions loaded"));
function hasPermission(userRole, requiredPermission) {
    var _a;
    const normalizedPermission = requiredPermission.toUpperCase();
    return (((_a = ROLE_PERMISSIONS[userRole.name]) === null || _a === void 0 ? void 0 : _a.includes(normalizedPermission)) || false);
}
function createRoleMiddleware(requiredPermissions) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required",
                message: "You must be logged in to access this resource",
            });
        }
        const userRole = yield prisma_1.prisma.role.findUnique({
            where: { id: req.user.roleId },
        });
        if (!userRole) {
            return res.status(403).json({
                error: "Role not assigned",
                message: "Your user account does not have a role assigned",
            });
        }
        const permissionsToCheck = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions];
        const hasRequiredPermission = permissionsToCheck.some((permission) => hasPermission(userRole, permission));
        if (hasRequiredPermission) {
            return next();
        }
        return res.status(403).json({
            error: "Insufficient Permissions",
            message: "You do not have permission to access this resource",
            requiredPermissions: permissionsToCheck,
            userRole,
        });
    });
}
