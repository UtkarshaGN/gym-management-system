import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { UserModel } from "../models/UserModel.mjs";
import { SessionDetailsModel } from "../models/SessionDetailsModel.mjs";
import { SessionModel } from "../models/SessionModel.mjs";

export class BookingController {
  static routes = express.Router();

  static {
    this.routes.get("/add", this.viewAddBookingForm);
    this.routes.get("/edit/:id", this.viewEditBookingForm);
    this.routes.get("/", this.viewBookingManagement);
    this.routes.post("/", this.handleBookingManagement);
    this.routes.post("/:id", this.handleBookingManagement);
    this.routes.post("/book/:sessionId", this.handleMemberBooking);
  }

  static async handleMemberBooking(req, res) {
    const sessionId = req.params.sessionId;
    const userId = req.authenticatedUser ? req.authenticatedUser.userId : null;
    if (!userId) return res.redirect("/auth");

    try {
      const session = await SessionModel.getById(sessionId);
      if (new Date(session.sessionDate) < new Date()) {
        return res.status(400).render("status.ejs", {
          status: "Booking Failed",
          message: "Cannot book a session in the past.",
        });
      }
      await BookingModel.create({ sessionId, userId, status: "booked" });
      res.render("status.ejs", {
        status: "Booking Successful!",
        message: "You have successfully booked the session.",
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

  static async viewBookingManagement(req, res) {
    try {
      const { sortBy, order, member, session, status, date } = req.query;
      const [bookings, users, sessions] = await Promise.all([
        BookingModel.getAllWithFilters({
          sortBy,
          order,
          member,
          session,
          status,
          date,
        }),
        UserModel.getAll(),
        SessionDetailsModel.getAll(),
      ]);

      res.render("admin_booking.ejs", {
        bookings,
        users,
        sessions,
        path: req.path,
        page: "bookings",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Error",
        message: "Could not load booking management page.",
      });
    }
  }

  static async viewAddBookingForm(req, res) {
    try {
      const [users, sessions] = await Promise.all([
        UserModel.getAll(),
        SessionDetailsModel.getAll(),
      ]);
      res.render("admin_booking_form.ejs", {
        booking: null,
        users,
        sessions,
        page: "bookings",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Error",
        message: "Could not load form.",
      });
    }
  }

  static async viewEditBookingForm(req, res) {
    try {
      const [booking, users, sessions] = await Promise.all([
        BookingModel.getById(req.params.id),
        UserModel.getAll(),
        SessionDetailsModel.getAll(),
      ]);

      res.render("admin_booking_form.ejs", {
        booking,
        users,
        sessions,
        page: "bookings",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("status.ejs", {
        status: "Error",
        message: "Could not load the booking form.",
      });
    }
  }

  static async handleBookingManagement(req, res) {
    const bookingId = req.params.id;
    const { action, userId, sessionId, status } = req.body;

    try {
      if (action === "create") {
        // ---- START OF NEW CODE ----
        // Check if this booking already exists
        const isAlreadyBooked = await BookingModel.isDoubleBooked(
          userId,
          sessionId
        );
        if (isAlreadyBooked) {
          return res.status(400).render("status.ejs", {
            status: "Booking Failed",
            message: "This member is already booked for this session.",
          });
        }
        // ---- END OF NEW CODE ----

        // This check for past sessions is also good
        const session = await SessionModel.getById(sessionId);
        if (new Date(session.sessionDate) < new Date()) {
          return res.status(400).render("status.ejs", {
            status: "Booking Failed",
            message: "Cannot create a booking for a past session.",
          });
        }
        const newBooking = { userId, sessionId, status };
        await BookingModel.create(newBooking);
      } else if (action === "update") {
        const updatedBooking = { bookingId, status };
        await BookingModel.update(updatedBooking);
      } else if (action === "delete") {
        await BookingModel.delete(bookingId);
      }
      res.redirect("/booking");
    } catch (error) {
      console.error(error);
      // The BookingModel.create might still throw an error (which is good!)
      // This will catch it and show a generic error message.
      res.status(500).render("status.ejs", {
        status: "Database error",
        message:
          "Failed to process booking operation. The user may already be booked.",
      });
    }
  }
}
