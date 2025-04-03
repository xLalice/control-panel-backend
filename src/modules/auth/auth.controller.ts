import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client/wasm";
import passport from "../../config/passport";

export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err: Error) => {
      if (err) return next(err);

      req.session.save((err: Error) => {
        if (err) return next(err);

        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    });
  })(req, res, next);
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
