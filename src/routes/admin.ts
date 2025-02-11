import express from "express";
import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { error, info} from "../utils/logger";

const router = express.Router();

router.get("/users",  isAuthenticated, async (req, res): Promise<any> => {
    try{
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch(err){
        error("Error during authentication", error);  
        res.status(500).json("Error fetching users");
    }
})

router.post("/users",  async (req, res): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;

    // Ensure password and other required fields are provided
    if (!password || !name || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    res.status(201).json({ newUser, message: "Successfully created the user" });
  } catch (err) {
    error(error);
    res.status(500).json({ error: "Error creating user." });
  }
});

// Edit User route
router.put("/users/:id",  async (req, res): Promise<any> => {
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
    error(error);
    res.status(500).json({ error: "Error updating user." });
  }
});

router.delete("/users/:id",  async (req, res): Promise<any> => {
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

export default router;