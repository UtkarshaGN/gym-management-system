import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingModel extends DatabaseModel {
  constructor(bookingId, sessionId, userId, status) {
    super();
    this.bookingId = bookingId;
    this.sessionId = sessionId;
    this.userId = userId;
    this.status = status;
  }

  static tableToModel(row) {
    return new BookingModel(
      row["booking_id"],
      row["session_id"],
      row["user_id"],
      row["status"]
    );
  }

  static async isDoubleBooked(userId, sessionId) {
    const sql = "SELECT * FROM bookings WHERE user_id = ? AND session_id = ?";
    const results = await this.query(sql, [userId, sessionId]);
    return results.length > 0;
  }

  static async create(booking) {
    if (await this.isDoubleBooked(booking.userId, booking.sessionId)) {
      throw new Error("User is already booked for this session.");
    }
    return this.query(
      `INSERT INTO bookings (session_id, user_id, status) VALUES (?, ?, ?)`,
      [booking.sessionId, booking.userId, booking.status]
    );
  }

  static getAll(sortBy = "sessionDate", order = "desc") {
    const columnMapping = {
      memberName: "u.first_name",
      session: "a.activity_name",
      sessionDate: "s.session_date",
      status: "b.status",
    };

    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy)
      ? sortBy
      : "sessionDate";
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const sql = `
            SELECT 
                b.booking_id, b.status, b.user_id, b.session_id,
                u.first_name, u.last_name,
                s.session_date, s.start_time,
                a.activity_name
            FROM bookings b
            JOIN users u ON u.user_id = b.user_id
            JOIN sessions s ON s.session_id = b.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            ORDER BY ${sortColumnSQL} ${sortOrder}, s.start_time
        `;

    return this.query(sql).then((results) =>
      results.map((row) => ({
        bookingId: row.b.booking_id,
        status: row.b.status,
        userId: row.b.user_id,
        sessionId: row.b.session_id,
        firstName: row.u.first_name,
        lastName: row.u.last_name,
        sessionDate: row.s.session_date,
        startTime: row.s.start_time,
        activityName: row.a.activity_name,
      }))
    );
  }

  //static getAllWithFilters(filters) {
  //let { sortBy = "sessionDate", order = "desc", member } = filters;

  //const columnMapping = {
  //memberName: "u.first_name",
  //session: "a.activity_name",
  //sessionDate: "s.session_date",
  // status: "b.status",
  //};

  //const validSortColumns = Object.keys(columnMapping);
  //const sortColumnJS = validSortColumns.includes(sortBy)
  //  ? sortBy
  // : "sessionDate";
  //const sortColumnSQL = columnMapping[sortColumnJS];
  //const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";
  static getAllWithFilters(filters) {
    let {
      sortBy = "sessionDate",
      order = "desc",
      member,
      session,
      status,
      date,
    } = filters;

    const columnMapping = {
      memberName: "u.first_name",
      session: "a.activity_name",
      sessionDate: "s.session_date",
      status: "b.status",
    };

    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy)
      ? sortBy
      : "sessionDate";
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    let sql = `
        SELECT 
            b.booking_id, b.status, b.user_id, b.session_id,
            u.first_name, u.last_name,
            s.session_date, s.start_time,
            a.activity_name
        FROM bookings b
        JOIN users u ON u.user_id = b.user_id
        JOIN sessions s ON s.session_id = b.session_id
        JOIN activities a ON s.activity_id = a.activity_id
    `;

    let whereClauses = [];
    let params = [];

    if (member) {
      whereClauses.push("b.user_id = ?");
      params.push(member);
    }
    if (session) {
      whereClauses.push("b.session_id = ?");
      params.push(session);
    }
    if (status) {
      whereClauses.push("b.status = ?");
      params.push(status);
    }
    if (date) {
      whereClauses.push("s.session_date = ?");
      params.push(date);
    }

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += ` ORDER BY ${sortColumnSQL} ${sortOrder}, s.start_time`;

    return this.query(sql, params).then((results) =>
      results.map((row) => ({
        bookingId: row.b.booking_id,
        status: row.b.status,
        userId: row.b.user_id,
        sessionId: row.b.session_id,
        firstName: row.u.first_name,
        lastName: row.u.last_name,
        sessionDate: row.s.session_date,
        startTime: row.s.start_time,
        activityName: row.a.activity_name,
      }))
    );
  }

  static async create(booking) {
    return this.query(
      `INSERT INTO bookings (session_id, user_id, status) VALUES (?, ?, ?)`,
      [booking.sessionId, booking.userId, booking.status]
    );
  }

  static async update(booking) {
    return this.query(`UPDATE bookings SET status = ? WHERE booking_id = ?`, [
      booking.status,
      booking.bookingId,
    ]);
  }

  static async delete(id) {
    return this.query(`DELETE FROM bookings WHERE booking_id = ?`, [id]);
  }

  static getById(id) {
    const sql = `SELECT * FROM bookings WHERE booking_id = ?`;
    return this.query(sql, [id]).then((results) => {
      if (results.length > 0) {
        return this.tableToModel(results[0].bookings);
      }
      return Promise.reject("not found");
    });
  }

  static getAllByUserId(userId, sortBy = "sessionDate", order = "asc") {
    const columnMapping = {
      sessionName: "a.activity_name",
      sessionDate: "s.session_date",
      time: "s.start_time",
      location: "l.location_name",
      trainer: "u.first_name",
      status: "b.status",
    };
    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy)
      ? sortBy
      : "sessionDate";
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  const sql = `
            SELECT 
                b.booking_id, b.status,
                s.session_id,  
                s.session_date, s.start_time,
                a.activity_name, 
                CONCAT(u.first_name, ' ', u.last_name) AS trainer_name,
                l.location_name
            FROM bookings b
            JOIN sessions s ON b.session_id = s.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON s.trainer_id = u.user_id
            WHERE b.user_id = ? AND b.status = 'booked'
            ORDER BY ${sortColumnSQL} ${sortOrder}
        `;
    return this.query(sql, [userId]).then((results) =>
      results.map((row) => ({
        bookingId: row.b.booking_id,
        sessionId: row.s.session_id, // <-- *** ADD THIS LINE ***
        status: row.b.status,
        sessionDate: row.s.session_date,
        startTime: row.s.start_time,
        activityName: row.a.activity_name,
        trainerName: row[""].trainer_name,
        locationName: row.l.location_name,
      }))
    );
  }
}
