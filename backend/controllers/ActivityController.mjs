import express from "express";
import { ActivityModel } from "../models/ActivityModel.mjs";

export class ActivityController {
  static routes = express.Router();

  static {
    this.routes.get("/add", this.viewAddActivityForm);
    this.routes.get("/edit/:id", this.viewEditActivityForm);
    this.routes.get("/", this.viewActivityManagement);
    this.routes.post("/", this.handleActivityManagement);
    this.routes.post("/:id", this.handleActivityManagement);
  }

  static async viewActivityManagement(req, res) {
    try {
      const { sortBy, order, activityName } = req.query;
      const activities = await ActivityModel.getAll(sortBy, order, { activityName });
      res.render("admin_activities.ejs", {
        activities,
        page: "activities",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Error",
        message: "Could not load activities page.",
      });
    }
  }

  static viewAddActivityForm(req, res) {
    res.render("admin_activity_form.ejs", {
      activity: null,
      page: "activities",
    });
  }

  static async viewEditActivityForm(req, res) {
    try {
      const activity = await ActivityModel.getById(req.params.id);
      res.render("admin_activity_form.ejs", {
        activity,
        page: "activities",
      });
    } catch (error) {
      res.status(404).render("status.ejs", {
        status: "Error",
        message: "Activity not found.",
      });
    }
  }

  static async handleActivityManagement(req, res) {
    const activityId = req.params.id;
    const { action, activityName, description } = req.body;

    try {
      // Regex patterns
      const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/; 
      // Allows letters and single spaces between words (e.g Yoga Class, Strength Training)
      
      const descriptionRegex = /^[A-Za-z0-9\s]+$/; 
      // Allows letters, numbers, and spaces only

      // Validate activity name
      if (!nameRegex.test(activityName)) {
        return res.status(400).render("status.ejs", {
          status: "Validation Error",
          message:
            "Invalid activity name. Only letters and single spaces between words are allowed (no numbers, symbols,multiple spaces).",
        });
      }

      // Validate description
      if (!descriptionRegex.test(description)) {
        return res.status(400).render("status.ejs", {
          status: "Validation Error",
          message:
            "Invalid description. Only letters, numbers and spaces are allowed- no symbols, special characters.",
        });
      }

      // Database operations
      if (action === "create") {
        await ActivityModel.create({ activityName, description });
      } else if (action === "update") {
        await ActivityModel.update({ activityId, activityName, description });
      } else if (action === "delete") {
        await ActivityModel.delete(activityId);
      }

      res.redirect("/activity");
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Database error",
        message: "Failed to process activity operation.",
      });
    }
  }
}
