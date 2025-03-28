import { Request, Response, NextFunction } from "express";
import { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma";

let ROLE_PERMISSIONS: Record<string, string[]> = {};

async function loadPermissions() {
  const roles = await prisma.role.findMany({
    select: { name: true, permissions: true },
  });
  
  roles.forEach((role) => {
    // Normalize permissions to uppercase
    ROLE_PERMISSIONS[role.name] = role.permissions.map(p => p.toUpperCase());
  });
}

loadPermissions().then(() => console.log("Permissions loaded"));

function hasPermission(userRole: Role, requiredPermission: string): boolean {
  const normalizedPermission = requiredPermission.toUpperCase();
  return ROLE_PERMISSIONS[userRole.name]?.includes(normalizedPermission) || false;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function createRoleMiddleware(
  requiredPermissions: string | string[]
): any {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to access this resource",
      });
    }

    const userRole = await prisma.role.findUnique({
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

    console.log("Permissions to check", permissionsToCheck);

    const hasRequiredPermission = permissionsToCheck.some((permission) =>
      hasPermission(userRole, permission)
    );

    console.log("Has required permission", hasRequiredPermission);

    if (hasRequiredPermission) {
      return next();
    }

    return res.status(403).json({
      error: "Insufficient Permissions",
      message: "You do not have permission to access this resource",
      requiredPermissions: permissionsToCheck,
      userRole,
    });
  };
}