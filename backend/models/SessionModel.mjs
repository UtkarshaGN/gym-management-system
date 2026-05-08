import { DatabaseModel } from "./DatabaseModel.mjs";

export class SessionModel extends DatabaseModel {
  constructor(
    sessionId,
    activityId,
    locationId,
    trainerId,
    sessionDate,
    startTime,
    endTime,
    activityName = "",
    locationName = "",
    trainerName = ""
  ) {
    super();
    this.sessionId = sessionId;
    this.activityId = activityId;
    this.locationId = locationId;
    this.trainerId = trainerId;
    this.sessionDate = sessionDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.activityName = activityName;
    this.locationName = locationName;
    this.trainerName = trainerName;
  }

  static tableToModel(row) {
    const sessionData = row.sessions || row.s || row;
    const activityData = row.activities || row.a || {};
    const locationData = row.locations || row.l || {};
    const userData = row.users || row.u || {};

    const formattedDate = sessionData.session_date
      ? new Date(sessionData.session_date).toISOString().split("T")[0]
      : null;

    return new SessionModel(
      sessionData.session_id,
      sessionData.activity_id,
      sessionData.location_id,
      sessionData.trainer_id,
      formattedDate,
      sessionData.start_time,
      sessionData.end_time,
      activityData.activity_name,
      locationData.location_name,
      userData.first_name ? `${userData.first_name} ${userData.last_name}` : ""
    );
  }

  static async getAll(sortBy = "sessionDate", order = "desc") {
    const columnMapping = {
      activity: "a.activity_name",
      location: "l.location_name",
      trainer: "u.first_name",
      sessionDate: "s.session_date",
      startTime: "s.start_time",
      endTime: "s.end_time",
    };

    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy)
      ? sortBy
      : "sessionDate";
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const query = `
        SELECT s.*, a.activity_name, l.location_name, u.first_name, u.last_name
        FROM sessions s
        LEFT JOIN activities a ON s.activity_id = a.activity_id
        LEFT JOIN locations l ON s.location_id = l.location_id
        LEFT JOIN users u ON s.trainer_id = u.user_id
        ORDER BY ${sortColumnSQL} ${sortOrder}
    `;
    return this.query(query).then((result) =>
      result.map((row) => this.tableToModel(row))
    );
  }

  static async getAllWithFilters(filters) {
    let {
      sortBy = "sessionDate",
      order = "desc",
      startDate,
      endDate,
      trainer,
    } = filters;

    const columnMapping = {
      activity: "a.activity_name",
      location: "l.location_name",
      trainer: "u.first_name",
      sessionDate: "s.session_date",
      startTime: "s.start_time",
      endTime: "s.end_time",
    };

    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy)
      ? sortBy
      : "sessionDate";
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    let query = `
        SELECT s.*, a.activity_name, l.location_name, u.first_name, u.last_name
        FROM sessions s
        LEFT JOIN activities a ON s.activity_id = a.activity_id
        LEFT JOIN locations l ON s.location_id = l.location_id
        LEFT JOIN users u ON s.trainer_id = u.user_id
    `;

    let whereClauses = [];
    let params = [];

    if (startDate) {
      whereClauses.push("s.session_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("s.session_date <= ?");
      params.push(endDate);
    }
    if (trainer) {
      whereClauses.push("s.trainer_id = ?");
      params.push(trainer);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += ` ORDER BY ${sortColumnSQL} ${sortOrder}`;

    return this.query(query, params).then((result) =>
      result.map((row) => this.tableToModel(row))
    );
  }

  static async getById(id) {
    const query = `SELECT * FROM sessions WHERE session_id = ?`;
    return this.query(query, [id]).then((result) =>
      result.length > 0
        ? this.tableToModel(result[0])
        : Promise.reject("not found")
    );
  }

  static async create(session) {
    return this.query(
      `INSERT INTO sessions (activity_id, location_id, trainer_id, session_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.activityId,
        session.locationId,
        session.trainerId,
        session.sessionDate,
        session.startTime,
        session.endTime,
      ]
    );
  }

  static async update(session) {
    return this.query(
      `UPDATE sessions
       SET activity_id = ?, location_id = ?, trainer_id = ?, session_date = ?, start_time = ?, end_time = ?
       WHERE session_id = ?`,
      [
        session.activityId,
        session.locationId,
        session.trainerId,
        session.sessionDate,
        session.startTime,
        session.endTime,
        session.sessionId,
      ]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM sessions WHERE session_id = ?", [id]);
  }

  static async getByTrainerId(trainerId, filters = {}) {
    const { activityName, locationName, date } = filters;
    let sql = `
        SELECT
          s.*,
          a.activity_name,
          l.location_name,
          (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id) as booking_count
        FROM sessions s
        LEFT JOIN activities a ON s.activity_id = a.activity_id
        LEFT JOIN locations l ON s.location_id = l.location_id
        WHERE s.trainer_id = ?
    `;
    const params = [trainerId];

    if (activityName) {
      sql += " AND a.activity_name LIKE ?";
      params.push(`%${activityName}%`);
    }
    if (locationName) {
      sql += " AND l.location_name LIKE ?";
      params.push(`%${locationName}%`);
    }
    if (date) {
      sql += " AND s.session_date = ?";
      params.push(date);
    }

    sql += " ORDER BY s.session_date DESC, s.start_time ASC";

    return this.query(sql, params).then((result) => {
      return result.map((row) => {
        const model = this.tableToModel(row);
        model.bookingCount = row[""].booking_count;
        return model;
      });
    });
  }
}
