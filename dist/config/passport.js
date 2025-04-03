"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email" }, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user) {
            console.log("No user found with the email:", email);
            return done(null, false, { message: "Email does not exist." });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log("Incorrect password attempt for user:", email);
            return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
    }
    catch (error) {
        console.error("Error during authentication:", error);
        return done(error);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, { id: user.id, roleId: user.roleId });
});
passport_1.default.deserializeUser((obj, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { id: obj.id },
            include: { role: true }
        });
        if (!user) {
            console.log("User not found during deserialization.");
            return done(null, false);
        }
        done(null, user);
    }
    catch (error) {
        console.log("Error deserializing user:", error);
        done(error, null);
    }
}));
exports.default = passport_1.default;
