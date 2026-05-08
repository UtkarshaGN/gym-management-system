import { DatabaseModel } from "./DatabaseModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";

export class SessionDetailsModel extends DatabaseModel {
  constructor(session, activity, location) {
    super();
    this.session = session;
    this.activity = activity;
    this.location = location;
  }

  static tableToModel(row) {
    return new SessionDetailsModel(
      SessionModel.tableToModel(row),
      ActivityModel.tableToModel(row),
      LocationModel.tableToModel(row.locations)
    );
  }

  static getAll() {
    return this.query(
      `
            SELECT * FROM activities
            INNER JOIN sessions ON activities.activity_id = sessions.activity_id
            INNER JOIN locations ON sessions.location_id = locations.location_id
            `
    ).then((results) => results.map((row) => this.tableToModel(row)));
  }

  static getById(id) {
    return this.query(
      `
            SELECT * FROM activities
            INNER JOIN sessions ON activities.activity_id =sessions.activity_id
            INNER JOIN locations ON sessions.location_id = locations.location_id
            where sessions.session_id =  ?
            `,
      [id]
    ).then((result) =>
      result.length > 0
        ? this.tableToModel(result[0])
        : Promise.reject("not found")
    );
  }

  static getWithFilters(filters) {
    let sql = `
        SELECT *
        FROM sessions
        INNER JOIN activities ON sessions.activity_id = activities.activity_id
        INNER JOIN locations ON sessions.location_id = locations.location_id
        LEFT JOIN users ON sessions.trainer_id = users.user_id 
    `;
    const values = [];
    const whereClauses = [];

    if (filters.date) {
      whereClauses.push("DATE(sessions.session_date) = ?");
      values.push(filters.date);
    }
    if (filters.location) {
      whereClauses.push("locations.location_name = ?");
      values.push(filters.location);
    }
    if (filters.session && filters.session !== "All") {
      whereClauses.push("activities.activity_name = ?");
      values.push(filters.session);
    }
    if (filters.time) {
      whereClauses.push("TIME_FORMAT(sessions.start_time, '%H:%i') = ?");
      values.push(filters.time);
    }

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    return this.query(sql, values).then((results) =>
      results.map((row) => this.tableToModel(row))
    );
  }
}
