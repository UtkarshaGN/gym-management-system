import express from "express";
import { SessionDetailsModel } from "../models/SessionDetailsModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";
import { PostModel } from "../models/PostModel.mjs";

const memberOnly = (req, res, next) => {
  if (req.authenticatedUser && req.authenticatedUser.role === "member") {
    return next();
  }
  res.redirect("/auth");
};

export class MemberController {
  static routes = express.Router();

  static {
    this.routes.get("/sessions", this.viewAllSessions);
    this.routes.post(
      "/book-session/:sessionId",
      memberOnly,
      this.handleMemberBooking
    );
    this.routes.get("/my-sessions", memberOnly, this.viewMySessions);
    this.routes.post("/cancel-booking/:id", memberOnly, this.cancelBooking);
    this.routes.get("/my-posts", memberOnly, this.viewMyPosts);
    this.routes.post("/my-posts", memberOnly, this.handleMyPosts);
    this.routes.post("/my-posts/delete/:id", memberOnly, this.handleMyPosts);
  }

  static async handleMemberBooking(req, res) {
    const sessionId = req.params.sessionId;
    const userId = req.authenticatedUser.userId;

    try {
      await BookingModel.create({ sessionId, userId, status: "booked" });
      res.render("status.ejs", {
        status: "Booking Successful!",
        message:
          "You have successfully booked the session. View it in 'My Sessions'.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Booking Failed",
        message:
          "There was a problem booking your session. You may have already booked it.",
      });
    }
  }

static async viewAllSessions(req, res) {
    try {
      const sessions = await SessionDetailsModel.getWithFilters(req.query);

      // ---- START OF NEW LOGIC ----
      const bookedSessionIds = new Set();
      // Check if a member is logged in
      if (req.authenticatedUser && req.authenticatedUser.role === "member") {
        // Get all their bookings
        const myBookings = await BookingModel.getAllByUserId(
          req.authenticatedUser.userId
        );
        
        // Add each booked session ID to a Set for easy lookup
        for (const booking of myBookings) {
          bookedSessionIds.add(booking.sessionId);
        }
      }
      // ---- END OF NEW LOGIC ----

      res.render("member_sessions_calendar.ejs", {
        sessions,
        path: req.path,
        query: req.query,
        bookedSessionIds, // <-- PASS THE SET TO THE VIEW
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching sessions.");
    }
  }

  static async viewMySessions(req, res) {
    try {
      const { sortBy, order } = req.query;
      const bookings = await BookingModel.getAllByUserId(
        req.authenticatedUser.userId,
        sortBy,
        order
      );
      res.render("member_my_sessions.ejs", {
        bookings,
        path: "/member/my-sessions", 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching your sessions.");
    }
  }


  static async cancelBooking(req, res) {
    try {
      await BookingModel.delete(req.params.id);
      res.redirect("/member/my-sessions");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error cancelling booking.");
    }
  }

  static async viewMyPosts(req, res) {
    try {
      const { sortBy, order } = req.query;
      const posts = await PostModel.getByUserId(
        req.authenticatedUser.userId,
        sortBy,
        order
      );
      res.render("member_my_posts.ejs", {
        posts,
        path: "/member/my-posts",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching your posts.");
    }
  }

  static handleMyPosts(req, res) {
    const { action, title, content } = req.body;
    const userId = req.authenticatedUser.userId;
    const postId = req.params.id;

    if (action === "create") {
      const newPost = { userId, title, content, createdAt: new Date() };
      PostModel.create(newPost)
        .then(() => res.redirect("/member/my-posts"))
        .catch((err) => res.status(500).send("Failed to create post."));
    } else if (action === "delete") {
      PostModel.delete(postId)
        .then(() => res.redirect("/member/my-posts"))
        .catch((err) => res.status(500).send("Failed to delete post."));
    } else {
      res.status(400).send("Invalid action.");
    }
  }
}
