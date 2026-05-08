import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { PostModel } from "../models/PostModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";

const trainerOnly = (req, res, next) => {
  if (req.authenticatedUser && req.authenticatedUser.role === "trainer") {
    return next();
  }
  res.status(403).render("status.ejs", {
    status: "Access Denied",
    message: "You do not have permission to view this page.",
  });
};

export class TrainerController {
  static routes = express.Router();

  static {
    this.routes.use(trainerOnly);
    this.routes.get("/sessions", this.viewWeeklyCalendar);
    this.routes.get("/sessions/add", this.viewAddSessionForm);
    this.routes.get("/sessions/edit/:id", this.viewEditSessionForm);
    this.routes.post("/sessions", this.handleSessionManagement);
    this.routes.post("/sessions/:id", this.handleSessionManagement);

    this.routes.get("/posts", this.viewPostManagement);
    this.routes.post("/posts", this.handlePostManagement);
    this.routes.post("/posts/delete/:id", this.handlePostManagement);
  }

  static async viewWeeklyCalendar(req, res) {
    try {
      const { activityName, locationName, date } = req.query;
      const sessions = await SessionModel.getByTrainerId(
        req.authenticatedUser.userId,
        {
          activityName,
          locationName,
          date,
        }
      );
      res.render("trainer_sessions.ejs", {
        sessions,
        user: req.authenticatedUser,
        query: req.query,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching trainer sessions.");
    }
  }

  static async viewAddSessionForm(req, res) {
    try {
      const [activities, locations] = await Promise.all([
        ActivityModel.getAll(),
        LocationModel.getAll(),
      ]);
      res.render("trainer_session_form.ejs", {
        session: null,
        activities,
        locations,
        page: "sessions",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .render("status.ejs", {
          status: "Error",
          message: "Could not load the form page.",
        });
    }
  }

  static async viewEditSessionForm(req, res) {
    try {
      const sessionId = req.params.id;
      const [session, activities, locations] = await Promise.all([
        SessionModel.getById(sessionId),
        ActivityModel.getAll(),
        LocationModel.getAll(),
      ]);

      // Security check: ensure trainer owns this session
      if (session.trainerId !== req.authenticatedUser.userId) {
        return res
          .status(403)
          .render("status.ejs", {
            status: "Access Denied",
            message: "You are not authorized to edit this session.",
          });
      }

      res.render("trainer_session_form.ejs", {
        session,
        activities,
        locations,
        page: "sessions",
      });
    } catch (error) {
      console.error(error);
      res
        .status(404)
        .render("status.ejs", {
          status: "Error",
          message: "Session not found.",
        });
    }
  }

  static async handleSessionManagement(req, res) {
    const sessionId = req.params.id;
    const { action, activityId, locationId, sessionDate, startTime, endTime } =
      req.body;
    const trainerId = req.authenticatedUser.userId;

    if (new Date(sessionDate) < new Date()) {
      return res.status(400).render("status.ejs", {
        status: "Invalid Date",
        message: "You cannot create or update a session to a past date.",
      });
    }

    try {
      if (action === "create") {
        const sessionData = {
          activityId,
          locationId,
          trainerId,
          sessionDate,
          startTime,
          endTime,
        };
        await SessionModel.create(sessionData);
      } else if (action === "update") {
        const session = await SessionModel.getById(sessionId);
        if (session.trainerId !== trainerId) {
          return res
            .status(403)
            .render("status.ejs", {
              status: "Access Denied",
              message: "You are not authorized to update this session.",
            });
        }
        const sessionData = {
          sessionId,
          activityId,
          locationId,
          trainerId,
          sessionDate,
          startTime,
          endTime,
        };
        await SessionModel.update(sessionData);
      } else if (action === "delete") {
        const session = await SessionModel.getById(sessionId);
        if (session.trainerId !== trainerId) {
          return res
            .status(403)
            .render("status.ejs", {
              status: "Access Denied",
              message: "You are not authorized to delete this session.",
            });
        }
        await SessionModel.delete(sessionId);
      }
      res.redirect("/trainer/sessions");
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .render("status.ejs", {
          status: "Database error",
          message: "Failed to process session operation.",
        });
    }
  }

  static async viewPostManagement(req, res) {
    try {
      const { sortBy, order } = req.query;
      const posts = await PostModel.getByUserId(
        req.authenticatedUser.userId,
        sortBy,
        order
      );
      res.render("trainer_posts.ejs", {
        posts,
        user: req.authenticatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching trainer posts.");
    }
  }

  static handlePostManagement(req, res) {
    const { action, title, content } = req.body;
    const userId = req.authenticatedUser.userId;
    const postId = req.params.id;

    if (action === "create") {
      const newPost = { userId, title, content, createdAt: new Date() };
      PostModel.create(newPost)
        .then(() => res.redirect("/trainer/posts"))
        .catch((err) => {
          console.error(err);
          res.status(500).send("Failed to create post.");
        });
    } else if (action === "delete") {
      PostModel.delete(postId)
        .then(() => res.redirect("/trainer/posts"))
        .catch((err) => {
          console.error(err);
          res.status(500).send("Failed to delete post.");
        });
    } else {
      res.status(400).send("Invalid action.");
    }
  }
}
