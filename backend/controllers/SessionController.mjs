import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";
import { UserModel } from "../models/UserModel.mjs"; 

export class SessionController {
    static routes = express.Router();

    static {
        this.routes.get("/add", this.viewAddSessionForm);
        this.routes.get("/edit/:id", this.viewEditSessionForm);
        this.routes.get("/", this.viewSessionManagement);
        this.routes.post("/", this.handleSessionManagement);
        this.routes.post("/:id", this.handleSessionManagement);
    }

    static async viewSessionManagement(req, res) {
        try {
            const { sortBy, order, startDate, endDate, trainer } = req.query;
            const sessions = await SessionModel.getAllWithFilters({ sortBy, order, startDate, endDate, trainer });
            const trainers = await UserModel.getAllTrainers();

            res.render("admin_sessions.ejs", {
                sessions,
                trainers,
                path: req.path,
                page: 'sessions' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).render("status.ejs", { status: "Error", message: "Could not load sessions page." });
        }
    }
    
    static async viewAddSessionForm(req, res) {
        try {
            const [activities, locations, trainers] = await Promise.all([
                ActivityModel.getAll(),
                LocationModel.getAll(),
                UserModel.getAllTrainers() 
            ]);
            res.render("admin_session_form.ejs", {
                session: null,
                activities,
                locations,
                trainers, 
                page: 'sessions'
            });
        } catch (error) {
            console.error(error);
            res.status(500).render("status.ejs", { status: "Error", message: "Could not load the form page." });
        }
    }

    static async viewEditSessionForm(req, res) {
        try {
            const [session, activities, locations, trainers] = await Promise.all([
                SessionModel.getById(req.params.id),
                ActivityModel.getAll(),
                LocationModel.getAll(),
                UserModel.getAllTrainers() 
            ]);
            res.render("admin_session_form.ejs", {
                session,
                activities,
                locations,
                trainers, 
                page: 'sessions'
            });
        } catch (error) {
            console.error(error);
            res.status(404).render("status.ejs", { status: "Error", message: "Session not found." });
        }
    }


    static async handleSessionManagement(req, res) {
        const sessionId = req.params.id;
        const { action, activityId, locationId, trainerId, sessionDate, startTime, endTime } = req.body;

        try {
            const sessionData = { sessionId, activityId, locationId, trainerId, sessionDate, startTime, endTime };
            
            if (action === "create") {
                await SessionModel.create(sessionData);
            } else if (action === "update") {
                await SessionModel.update(sessionData);
            } else if (action === "delete") {
                await SessionModel.delete(sessionId);
            }
            res.redirect("/sessions");
        } catch (error) {
            console.error(error);
            res.status(500).render("status.ejs", { status: "Database error", message: "Failed to process session operation." });
        }
    }
}