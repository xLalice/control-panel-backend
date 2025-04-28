import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error during authentication", error);
    res.status(500).json("Error fetching users");
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error during authentication", error);
    res.status(500).json("Error fetching roles");
  }
};

export const createNewUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!password || !name || !email || !role) {
      res.status(400).json({ error: "Missing required fields" });
    }

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
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ error: "Error creating user." });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { name, email, role } = req.body;

  try {
    if (!name && !email && !role) {
      res.status(400).json({ error: "No fields provided to update." });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user." });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting user." });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    if (!name || !permissions) {
      return res
        .status(400)
        .json({ error: "Name and permissions are required." });
    }

    if (permissions.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one permission is required." });
    }

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return res.status(400).json({ error: "Role already exists." });
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
  } catch (error) {
    console.error("Error creating role:", error);
    throw new Error("Failed to create role");
  }
};

export const editRole = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, permissions } = req.body;

    if (!name || !permissions) {
      return res
        .status(400)
        .json({ error: "Name and permissions are required." });
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
  } catch (error) {
    console.error("Error updating role:", error);
    throw new Error("Failed to update role");
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const deletedRole = await prisma.role.delete({
      where: { id },
    });

    res.status(200).json(deletedRole);
  } catch (error) {
    console.error("Error deleting role:", error);
    throw new Error("Failed to delete role");
  }
};

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export const togglePermission = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ error: "Role ID and Permission ID are required." });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found." });
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
  } catch (error) {
    console.error("Error toggling permission:", error);
    res.status(500).json({ error: "Failed to toggle permission" });
  }
};
