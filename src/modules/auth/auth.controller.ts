import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import passport from "../../config/passport";
import { Prisma } from "@prisma/client";

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: { include: { permissions: true } } };
}>;

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transformedUser = {
      ...user,
      role: {
        name: user.role.name,
        permissions: user.role.permissions.map((p) => p.name),
      },
    };

    return res.json(transformedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    (err: Error, user: UserWithRole, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });

      req.logIn(user, (err: Error) => {
        if (err) return next(err);

        req.session.save((err: Error) => {
          if (err) return next(err);

          const { password: _, ...userWithoutPassword } = user;
          const transformedUser = {
            ...userWithoutPassword,
            role: {
              name: user.role.name,
              permissions: user.role.permissions.map((p) => p.name),
            },
          };
          return res.json({ user: transformedUser });
        });
      });
    }
  )(req, res, next);
};

// User Logout
export const logoutUser = (req: Request, res: Response) => {
  req.logout((err: Error) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    req.session.destroy((err: Error) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Error destroying session" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
};
