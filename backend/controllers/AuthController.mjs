import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

export class AuthController {
  static middleware = express.Router();
  static routes = express.Router();

  static {
    this.middleware.use(
      session({
        secret: "6f33455a-b414-4cd7-95b0-d1160c2f89cd",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: "auto" },
      })
    );

    this.middleware.use(this.#session_authentication);

    this.routes.get("/", this.viewAuthenticate);
    this.routes.post("/", this.handleAuthenticate);

    this.routes.get("/register", this.viewRegister);
    this.routes.post("/register", this.handleRegister);

    this.routes.delete("/", this.handleDeauthenticate);
    this.routes.get("/logout", this.handleDeauthenticate);
  }

  static async #session_authentication(req, res, next) {
    if (req.session.userId && !req.authenticatedUser) {
      try {
        req.authenticatedUser = await UserModel.getById(req.session.userId);
      } catch (error) {
        console.error(error);
      }
    }
    res.locals.authenticatedUser = req.authenticatedUser; 
    next();
  }

  static async #api_key_authentication(req, res, next) {}

 
  static viewAuthenticate(req, res) {
    res.render("login.ejs");
  }

  static viewRegister(req, res) {
    res.render("register.ejs");
  }

static async handleAuthenticate(req, res) {
    const contentType = req.get("Content-Type");

    const username = req.body.username;
    const password = req.body.password;

    if (contentType == "application/x-www-form-urlencoded") {
      try {
        const user = await UserModel.getByUsername(username);
        const isCorrectPassword = await bcrypt.compare(password, user.password);

        if (isCorrectPassword) {
          req.session.userId = user.userId;
          req.session.role = user.role;

          if (user.role === "admin") {
            res.redirect("/user"); 
          } else if (user.role === "trainer") {
            res.redirect("/trainer/sessions"); 
          } else {
            res.redirect("/member/sessions"); 
          }
        } else {
          res.status(400).render("status.ejs", {
            status: "Authentication failed",
            message: "Invalid credentials",
          });
        }
      } catch (error) {
        if (error == "not found") {
          res.status(400).render("status.ejs", {
            status: "Authentication failed",
            message: "Invalid credentials",
          });
        } else {
          console.log(error);
          res.status(500).render("status.ejs", {
            status: "Database error",
            message: "Authentication failed",
          });
        }
      }
    } else {
      res.status(400).render("status.ejs", {
        status: "Authenticate failed",
        message: "Invalid authentication request body",
      });
    }
  }

  static handleDeauthenticate(req, res) {
    if (req.authenticatedUser) {
      if (req.session.userId) {
        req.session.destroy();
        res.redirect("/auth"); 
      }
    } else {
      res.status(401).render("status.ejs", {
        status: "Unauthenticated",
        message: " Please login to access the requested resource.",
      });
    }
  }

  
  static restrict(allowedRoles) {
    return (req, res, next) => {
      
      if (
        req.authenticatedUser &&
        allowedRoles.includes(req.authenticatedUser.role)
      ) {
        next(); 
      } else {
       
        res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "You do not have permission to view this page.",
        });
      }
    };
  }

  static async handleRegister(req, res) {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).render("status.ejs", {
        status: "Registration failed",
        message: "All fields are required",
      });
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new UserModel(
        null,
        firstName,
        lastName,
        "member", 
        username,
        hashedPassword
      );

      await UserModel.create(newUser);

      res.redirect("/auth");
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Database error",
        message: "Could not create user. The username may already exist.",
      });
    }
  }
}
