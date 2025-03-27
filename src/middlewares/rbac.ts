import { Request, Response, NextFunction } from "express";
import { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma";

let ROLE_PERMISSIONS: Record<string, string[]> = {};

async function loadPermissions() {
  const roles = await prisma.role.findMany({
    select: { name: true, permissions: true },
  });

  roles.forEach((role) => {
    ROLE_PERMISSIONS[role.name] = role.permissions.map((p) => p.toLowerCase());
  });
}

loadPermissions().then(() => console.log("Permissions loaded"));

/* const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "read:all",
    "write:all",
    "delete:all",
    "manage:users",
    "manage:system_settings",
    "manage:document_categories",
    "write:documents",
    "read:documents",
    "delete:documents",
    "read:inquiries",
    "write:inquiries",
    "update:inquiries",
    "delete:inquiries",
    "read:leads",    
    "write:leads",   
    "update:leads",  
    "delete:leads",  
    "read:products",    // View products
    "write:products",   // Create products
    "update:products",  // Update products
    "delete:products",
  ],
  MARKETING: [
    "read:leads",    
    "write:leads",  
    "read:inquiries",
    "read:posts",
    "write:posts",
    "read:reports",
    "write:documents",
    "read:documents",
    "read:products"
  ],
  SALES: [
    "read:leads",    
    "write:leads",   
    "update:leads", 
    "update:lead_status",
    "read:inquiries",
    "write:inquiries",
    "update:inquiries",
    "read:documents",
    "write:documents",
    "read:products"
  ],
  LOGISTICS: [
    "read:leads",    
    "read:inquiries",
    "update:inquiries",
    "read:products",
    "read:delivery_info",
    "read:documents",
    "read:products"
  ],
  ACCOUNTING: [
    "read:reports",
    "read:inquiries",
    "read:invoices",
    "read:financial_data",
    "generate:financial_reports",
    "read:documents",
    "read:leads",    
    "read:products"
  ],
}; */

function hasPermission(userRole: Role, requiredPermission: string): boolean {
  return ROLE_PERMISSIONS[userRole.name].includes(requiredPermission);
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

    const hasRequiredPermission = permissionsToCheck.some((permission) =>
      hasPermission(userRole, permission)
    );

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

export const middlewares = {
  adminOnly: createRoleMiddleware("manage:users"),
  manageLeads: createRoleMiddleware(["read:leads", "write:leads"]),
  marketingAccess: createRoleMiddleware("read:posts"),
  salesAccess: createRoleMiddleware("update:lead_status"),
  logisticsAccess: createRoleMiddleware("update:inquiry_status"),
  accountingAccess: createRoleMiddleware("generate:financial_reports"),

  categoryManagement: createRoleMiddleware("manage:document_categories"),
  documentUpload: createRoleMiddleware("write:documents"),
  documentAccess: createRoleMiddleware("read:documents"),
  documentDelete: createRoleMiddleware("delete:documents"),

  inquiryRead: createRoleMiddleware("read:inquiries"),
  inquiryWrite: createRoleMiddleware("write:inquiries"),
  inquiryUpdate: createRoleMiddleware("update:inquiries"),
  inquiryDelete: createRoleMiddleware("delete:inquiries"),

  leadRead: createRoleMiddleware("read:leads"),
  leadWrite: createRoleMiddleware("write:leads"),
  leadUpdate: createRoleMiddleware("update:leads"),
  leadDelete: createRoleMiddleware("delete:leads"),

  productRead: createRoleMiddleware("read:products"),
  productWrite: createRoleMiddleware("write:products"),
  productUpdate: createRoleMiddleware("update:products"),
  productDelete: createRoleMiddleware("delete:products"),
};

export function getRolePermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role.name] || [];
}
