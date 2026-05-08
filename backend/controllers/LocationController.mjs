import express from "express";
import { LocationModel } from "../models/LocationModel.mjs";

export class LocationController {
    static routes = express.Router();

    static {
        this.routes.get("/add", this.viewAddLocationForm);
        this.routes.get("/edit/:id", this.viewEditLocationForm);
        this.routes.get("/", this.viewLocationManagement);
        this.routes.post("/", this.handleLocationManagement);    
        this.routes.post("/:id", this.handleLocationManagement); 
    }

    static async viewLocationManagement(req, res) {
        try {
            const { sortBy, order, locationName } = req.query;
            const locations = await LocationModel.getAll(sortBy, order, { locationName });
            res.render("admin_locations.ejs", {
                locations,
                path: req.path,
                page: 'locations' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).render("status.ejs", { 
                status: "Error", 
                message: "Could not load locations page." 
            });
        }
    }

    static async viewAddLocationForm(req, res) {
        res.render("admin_location_form.ejs", {
            location: null,
            page: 'locations'
        });
    }

    static async viewEditLocationForm(req, res) {
        try {
            const location = await LocationModel.getById(req.params.id);
            res.render("admin_location_form.ejs", {
                location,
                page: 'locations'
            });
        } catch (error) {
            res.status(404).render("status.ejs", { 
                status: "Error", 
                message: "Location not found." 
            });
        }
    }

    static async handleLocationManagement(req, res) {
        const locationId = req.params.id;
        const { action, locationName } = req.body;

        try {
            // Regex validation: only letters allowed (no spaces, numbers, symbols)
            const nameRegex = /^[A-Za-z]+$/;
            if (!nameRegex.test(locationName)) {
                return res.status(400).render("status.ejs", {
                    status: "Validation Error",
                    message: "Invalid location name. Only letters (A–Z) are allowed. No numbers, spaces, or symbols."
                });
            }

            if (action === "create") {
                await LocationModel.create({ locationName });
            } else if (action === "update") {
                await LocationModel.update({ locationId, locationName });
            } else if (action === "delete") {
                await LocationModel.delete(locationId);
            }

            res.redirect("/location");
        } catch (error) {
            console.error(error);
            res.status(500).render("status.ejs", { 
                status: "Database error", 
                message: "Failed to process location operation." 
            });
        }
    }
}
