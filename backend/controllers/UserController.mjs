import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import { UserModel } from "../models/UserModel.mjs";

export class UserController {
  static routes = express.Router();

  static {
 
    this.routes.get("/add", this.viewAddUserForm);
    this.routes.get("/edit/:id", this.viewEditUserForm);


    this.routes.get("/", this.viewUserManagement);
    this.routes.post("/", this.handleUserManagement); 
    this.routes.post("/:id", this.handleUserManagement); 
  }

  static viewUserManagement(req, res) {
    const { sortBy, order } = req.query;
    UserModel.getAll(sortBy, order)
      .then((users) => {
        res.render("admincrud_users.ejs", {
          users,
          path: req.path,
          page: 'users'
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).render("status.ejs", {
          status: "Error",
          message: "Could not load user management page.",
        });
      });
  }
  
 
  static viewAddUserForm(req, res) {
    res.render("admin_user_form.ejs", {
      user: null,
      page: 'users'
    });
  }

  static async viewEditUserForm(req, res) {
    try {
      const user = await UserModel.getById(req.params.id);
      res.render("admin_user_form.ejs", {
        user,
        page: 'users'
      });
    } catch (error) {
      res.status(404).render("status.ejs", { status: "Error", message: "User not found" });
    }
  }
static handleUserManagement(req, res) {
  const selectedUserId = req.params.id;
  const formData = req.body;
  const action = formData.action;

  //  regex patterns
  const nameRegex = /^[a-zA-Z\-'\s]{2,}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  //const phoneRegex = /^[0-9+\-\s]{6,20}$/;

  // Validate input fields
  if (!nameRegex.test(formData.firstName)) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "Please enter a valid first name (letters, space, hyphen).",
    });
  }

  if (!nameRegex.test(formData.lastName)) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "Please enter a valid last name (letters, space, hyphen).",
    });
  }

  if (!usernameRegex.test(formData.username)) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "Username must be 3–20 characters and can contain letters, numbers or underscores.",
    });
  }

  if (formData.phone && !validator.isMobilePhone(formData.phone + '', 'any')) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "Please enter a valid phone number.",
    });
  }

  if (action === "create" && (!formData.password || formData.password.trim().length < 6)) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "Password is required and must be at least 6 characters for new users.",
    });
  }

  if (action === "update" && formData.password && formData.password.trim().length < 6) {
    return res.status(400).render("status.ejs", {
      status: "Invalid input",
      message: "If you change the password, it must be at least 6 characters long.",
    });
  }

  // Construct user object after passing validation
  const user = new UserModel(
    selectedUserId,
    formData.firstName,
    formData.lastName,
    formData.role,
    formData.username,
    formData.password,
    formData.phone
  );

  // Encrypt password if provided
  if (formData.password) {
    user.password = bcrypt.hashSync(formData.password, 10);
  }

  // Handle different actions
  if (action === "create") {
    UserModel.create(user)
      .then(() => res.redirect("/user"))
      .catch((error) => {
        console.error(error);
        res.status(500).render("status.ejs", {
          status: "Database error",
          message: "The user could not be created.",
        });
      });
  } else if (action === "update") {
    if (!formData.password) delete user.password;
    UserModel.update(user)
      .then(() => res.redirect("/user"))
      .catch((error) => {
        console.error(error);
        res.status(500).render("status.ejs", {
          status: "Database error",
          message: "The user could not be updated.",
        });
      });
  } else if (action === "delete") {
    UserModel.delete(selectedUserId)
      .then(() => res.redirect("/user"))
      .catch((error) => {
        console.error(error);
        res.status(500).render("status.ejs", {
          status: "Database error",
          message: "The user could not be deleted.",
        });
      });
  } else {
    res.status(400).render("status.ejs", {
      status: "Invalid action",
      message: "The form does not support this action.",
    });
  }
}
















  // static handleUserManagement(req, res) {
  //   const selectedUserId = req.params.id;
  //   const formData = req.body;
  //   const action = formData.action;

  //   const user = new UserModel(
  //     selectedUserId,
  //     formData.firstName,
  //     formData.lastName,
  //     formData.role,
  //     formData.username,
  //     formData.password,
  //     formData.phone
  //   );

  //   if (action === "create") {
  //     if (!user.password) {
  //       return res.status(400).render("status.ejs", {
  //         status: "Error",
  //         message: "Password is required for new users.",
  //       });
  //     }
  //     user.password = bcrypt.hashSync(user.password, 10);

  //     UserModel.create(user)
  //       .then(() => res.redirect("/user"))
  //       .catch((error) => {
  //         console.error(error);
  //         res.status(500).render("status.ejs", {
  //           status: "Database error",
  //           message: "The user could not be created.",
  //         });
  //       });
  //   } else if (action === "update") {
  //     if (user.password) {
  //       user.password = bcrypt.hashSync(user.password, 10);
  //     } else {
  //       delete user.password;
  //     }

  //     UserModel.update(user)
  //       .then(() => res.redirect("/user"))
  //       .catch((error) => {
  //         console.error(error);
  //         res.status(500).render("status.ejs", {
  //           status: "Database error",
  //           message: "The user could not be updated.",
  //         });
  //       });
  //   } else if (action === "delete") {
  //     UserModel.delete(selectedUserId)
  //       .then(() => res.redirect("/user"))
  //       .catch((error) => {
  //         console.error(error);
  //         res.status(500).render("status.ejs", {
  //           status: "Database error",
  //           message: "The user could not be deleted.",
  //         });
  //       });
  //   } else {
  //     res.status(400).render("status.ejs", {
  //       status: "Invalid action",
  //       message: "The form does not support this action.",
  //     });
  //   }
  // }
}