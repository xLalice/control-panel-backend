"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.loginUser = void 0;
const passport_1 = __importDefault(require("../../config/passport"));
const loginUser = (req, res, next) => {
    passport_1.default.authenticate("local", (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).json({ message: info.message });
        req.logIn(user, (err) => {
            if (err)
                return next(err);
            req.session.save((err) => {
                if (err)
                    return next(err);
                const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
                return res.json(userWithoutPassword);
            });
        });
    })(req, res, next);
};
exports.loginUser = loginUser;
// User Logout
const logoutUser = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Error logging out" });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Error destroying session" });
            }
            res.clearCookie("connect.sid");
            res.json({ message: "Logged out successfully" });
        });
    });
};
exports.logoutUser = logoutUser;
