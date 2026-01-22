import express from "express";
import expressSession from "express-session";
import passport from "./config/passport";
import flash from "connect-flash";
import cors from "cors";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import authRoutes from "./modules/auth/auth.routes";
import leadRoutes from "./modules/leads/lead.router"
import reportRoutes from "./modules/reports/reports.router";
import productRoutes from "./modules/products/product.routes"
import inquiryRoutes from "./modules/inquiries/inquiry.routes"
import documentRoutes from "./modules/documents/documents.routes"
import attendanceRoutes from "./modules/attendance/attendance.routes"
import userRoutes from "./modules/users/users.routes"
import clientRoutes from "./modules/clients/client.routes"
import quoteRoutes from "./modules/quotations/quotations.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes"
import salesOrderRoutes from "./modules/saleOrders/salesOrder.routes";
import { errorHandler } from "./middlewares/errorHandler";
import "dotenv/config";
import { prisma } from "config/prisma";

const SESSION_SECRET = process.env.SESSION_SECRET || "QWERTY";

if (!SESSION_SECRET) {
  throw "No session secret";
}

export const app = express();

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: [`${process.env.FRONTEND_URL}`],
    credentials: true,
  })
);


app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use('/api/documents', documentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/clients', clientRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales-order", salesOrderRoutes);

app.use(errorHandler)

export default app;