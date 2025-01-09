import express from "express";
import session from "express-session";
import passport from "passport";
import flash from "connect-flash";

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "Rca2ctiTiG",
        resave: "false",
        saveUnininitialized: "false"
}))

app.use(passport());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

app.get("/", );

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));