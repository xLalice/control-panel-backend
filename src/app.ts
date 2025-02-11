import express from "express";
import expressSession from "express-session";
import passport from "./config/passport"
import flash from "connect-flash";
import cors from "cors";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import salesRoutes from "./routes/sales";
import marketingRoutes from "./routes/marketing"
import { info } from "./utils/logger";
require("dotenv").config();

const SESSION_SECRET = process.env.SESSION_SECRET || "QWERTY"

if (!SESSION_SECRET){
  throw("No session secret");
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(
  expressSession({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      new PrismaClient(),
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  info("Session: ", req.session);
  
  next();
});
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes)
app.use("/api/sales", salesRoutes);
app.use("/api/marketing", marketingRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => info(`Server running on port ${PORT}`));