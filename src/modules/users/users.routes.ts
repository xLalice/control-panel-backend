import express from "express";
import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { error, info } from "../../utils/logger";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";

const router = express.Router();

router.get("/", checkPermission("read:users"), async (req, res): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (err) {
    error("Error during authentication", err);
    res.status(500).json("Error fetching users");
  }
});

router.get("/roles", checkPermission("read:users"), async (req, res): Promise<any> => {
  try {
    const roles = await prisma.role.findMany({select: { id: true, name: true }});
    res.status(200).json(roles);

  } catch (err){
    error("Error during authentication", err);
    res.status(500).json("Error fetching roles");
  }
});

router.post("/", checkPermission("manage:users"), async (req, res): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;

    if (!password || !name || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
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
  } catch (err) {
    error("Error", err);
    res.status(500).json({ error: "Error creating user." });
  }
});

// Edit User route
router.put("/:id", checkPermission("manage:users"), async (req, res): Promise<any> => {
  const userId = req.params.id;
  const { name, email, role } = req.body;

  try {
    // Ensure required fields are provided
    if (!name && !email && !role) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
      },
    });

    res
      .status(200)
      .json({ updatedUser, message: "User updated successfully." });
  } catch (err) {
    error(err);
    res.status(500).json({ error: "Error updating user." });
  }
});

router.delete("/:id", checkPermission("manage:users"), async (req, res): Promise<any> => {
  const userId = req.params.id;

  try {
    // Ensure that user exists before attempting to delete
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    error(err);
    res.status(500).json({ error: "Error deleting user." });
  }
});

router.get("/permissions", checkPermission("manage:users"), isAuthenticated, async (req, res): Promise<any> => {
  try {
    
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        role: {
          include: {
            permissions: {
              select: {
                name: true,
              },
            },
          }
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    
    res.status(200).json(user.role.permissions);
  } catch (err) {
    error(err);
    res.status(500).json({ error: "Error fetching permissions." });
  }
});

export default router;
