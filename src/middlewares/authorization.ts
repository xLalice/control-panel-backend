import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import { prisma } from "config/prisma";

const CACHE_PREFIX_ROLE_PERMISSIONS = "role_permissions:";
const CACHE_TTL = 5 * 60;

async function getPermissionsForRole(roleId: number): Promise<string[]> {
  const cacheKey = `${CACHE_PREFIX_ROLE_PERMISSIONS}${roleId}`;

  try {
    if (redisClient.isReady) {
      const cachedPermissions = await redisClient.get(cacheKey);
      if (cachedPermissions) {
        return JSON.parse(cachedPermissions) as string[];
      }
    } else {
      console.warn("Redis client not ready, skipping cache check.");
    }

    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { select: { name: true } } },
    });

    const permissions =
      roleWithPermissions?.permissions?.map((p) => p.name) || [];
    if (redisClient.isReady) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(permissions), {
          EX: CACHE_TTL,
        });
      } catch (cacheError) {
        console.error(
          `Failed to store permissions for role ${roleId} in cache:`,
          cacheError
        );
      }
    }

    return permissions;
  } catch (error) {
    console.error(
      `Error fetching/caching permissions for role ${roleId}:`,
      error
    );

    return [];
  }
}

export const checkPermission = (requiredPermissions: string | string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const permsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    
    const user = req.user;

      if (!user || !user.role) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      if (user.role.name === "Admin") {
        return next();
      }

      const userPermissions = await getPermissionsForRole(user.roleId);

      const hasAllPermissions = permsToCheck.every((rp) =>
        userPermissions.includes(rp)
      );

      if (hasAllPermissions) {
        return next();
      } else {
        console.warn(
          `User ${req.user.id} denied access. Required: ${permsToCheck.join(
            ", "
          )}. Has: ${userPermissions.join(", ")}`
        );
        res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions." });
        return;
      }
  };
};
