"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./config/passport"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const cors_1 = __importDefault(require("cors"));
const prisma_session_store_1 = require("@quixo3/prisma-session-store");
const client_1 = require("@prisma/client");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const lead_router_1 = __importDefault(require("./modules/leads/lead.router"));
const reports_router_1 = __importDefault(require("./modules/reports/reports.router"));
const product_routes_1 = __importDefault(require("./modules/products/product.routes"));
const inquiry_routes_1 = __importDefault(require("./modules/inquiries/inquiry.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const logger_1 = require("./utils/logger");
require("dotenv").config();
const SESSION_SECRET = process.env.SESSION_SECRET || "QWERTY";
if (!SESSION_SECRET) {
    throw "No session secret";
}
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)({
    origin: [`${process.env.FRONTEND_URL}`],
    credentials: true,
}));
exports.app.use((0, express_session_1.default)({
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    },
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new prisma_session_store_1.PrismaSessionStore(new client_1.PrismaClient(), {
        checkPeriod: 2 * 60 * 1000, //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    }),
}));
exports.app.use(passport_1.default.initialize());
exports.app.use(passport_1.default.session());
exports.app.use((0, connect_flash_1.default)());
exports.app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});
exports.app.use("/api/users", users_routes_1.default);
exports.app.use("/api/auth", auth_routes_1.default);
exports.app.use("/api/leads", lead_router_1.default);
exports.app.use("/api/reports", reports_router_1.default);
exports.app.use("/api/products", product_routes_1.default);
exports.app.use("/api/inquiries", inquiry_routes_1.default);
exports.app.use('/api/documents', documents_routes_1.default);
exports.app.use("/api/attendance", attendance_routes_1.default);
const PORT = process.env.PORT || 5000;
exports.app.listen(PORT, () => (0, logger_1.info)(`Server running on port ${PORT}`));
