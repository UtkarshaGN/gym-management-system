import { DatabaseModel } from "./DatabaseModel.mjs";

export class ActivityModel extends DatabaseModel {
  constructor(activityId, activityName, description) {
    super();
    this.activityId = activityId;
    this.activityName = activityName;
    this.description = description;
  }

  static tableToModel(row) {
    const activityData = row.activities || row.a || row;
    return new ActivityModel(
      activityData["activity_id"],
      activityData["activity_name"],
      activityData["description"]
    );
  }

  static getAll(sortBy = "activityName", order = "asc", filters = {}) {
    const { activityName } = filters;
    const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";
    let sql = `SELECT * FROM activities`;
    const params = [];

    if (activityName) {
      sql += " WHERE activity_name LIKE ?";
      params.push(`%${activityName}%`);
    }

    sql += ` ORDER BY activity_name ${sortOrder}`;

    return this.query(sql, params).then((result) => {
      return result.map((row) => this.tableToModel(row));
    });
  }

  static async getById(id) {
    return this.query("SELECT * FROM activities WHERE activity_id = ?", [
      id,
    ]).then((result) =>
      result.length > 0
        ? this.tableToModel(result[0])
        : Promise.reject("not found")
    );
  }

  static async create(activity) {
    return this.query(
      `INSERT INTO activities (activity_name, description) VALUES (?, ?)`,
      [activity.activityName, activity.description]
    );
  }

  static async update(activity) {
    return this.query(
      `UPDATE activities SET activity_name = ?, description = ? WHERE activity_id = ?`,
      [activity.activityName, activity.description, activity.activityId]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM activities WHERE activity_id = ?", [id]);
  }
}
