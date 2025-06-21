import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import bcrypt from "bcryptjs";
import { CreateUserSchema } from "./user.schema";
import { handleZodError } from "../../utils/zod";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
  });
  res.status(200).json(users);
});

export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true },
  });
  res.status(200).json(roles);
});

export const createNewUser = asyncHandler(async (req: Request, res: Response) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation failed",
      error: handleZodError(result.error),
    });
    return;
  }
  
  const { name, email, password, role } = result.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: {
        connect: {
          name: role,
        },
      },
    },
  });

  res.status(201).json({ newUser, message: "Successfully created the user" });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { name, email, role } = req.body;

  if (!name && !email && !role) {
    res.status(400).json({ error: "No fields provided to update." });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role: {
        connect: {
          id: role.id,
        },
      },
    },
  });

  res
    .status(200)
    .json({ updatedUser, message: "User updated successfully." });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  res.status(200).json({ message: "User deleted successfully." });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, permissions } = req.body;
  
  if (!name || !permissions) {
    res.status(400).json({ error: "Name and permissions are required." });
    return;
  }

  if (permissions.length === 0) {
    res.status(400).json({ error: "At least one permission is required." });
    return;
  }

  const existingRole = await prisma.role.findUnique({
    where: { name },
  });

  if (existingRole) {
    res.status(400).json({ error: "Role already exists." });
    return;
  }

  const newRole = await prisma.role.create({
    data: {
      name,
      permissions: {
        connect: permissions.map((permissionId: string) => ({
          id: permissionId,
        })),
      },
    },
  });
  
  res.status(201).json(newRole);
});

export const editRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, permissions } = req.body;

  if (!name || !permissions) {
    res.status(400).json({ error: "Name and permissions are required." });
    return;
  }

  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      name,
      permissions: {
        set: permissions.map((permissionId: string) => ({
          id: permissionId,
        })),
      },
    },
  });

  res.status(200).json(updatedRole);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const deletedRole = await prisma.role.delete({
    where: { id },
  });

  res.status(200).json(deletedRole);
});

export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany();

  const grouped = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push({
      id: permission.id,
      name: permission.name,
    });
    return acc;
  }, {} as Record<string, { id: number; name: string }[]>);

  const groupedArray = Object.entries(grouped).map(
    ([module, permissions]) => ({
      module,
      permissions,
    })
  );

  res.status(200).json(groupedArray);
});

export const togglePermission = asyncHandler(async (req: Request, res: Response) => {
  const { roleId, permissionId } = req.body;

  if (!roleId || !permissionId) {
    res.status(400).json({ error: "Role ID and Permission ID are required." });
    return;
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: true },
  });

  if (!role) {
    res.status(404).json({ error: "Role not found." });
    return;
  }

  const permissionExists = role.permissions.some(
    (p) => p.id === permissionId
  );

  if (permissionExists) {
    await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: [{ id: permissionId }],
        },
      },
    });
  } else {
    await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: [{ id: permissionId }],
        },
      },
    });
  }

  res.status(200).json({ message: "Permission toggled successfully." });
});