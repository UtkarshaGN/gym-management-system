import { DatabaseModel } from "./DatabaseModel.mjs";

export class LocationModel extends DatabaseModel {
  constructor(locationId, locationName) {
    super();
    this.locationId = locationId;
    this.locationName = locationName;
  }

  static tableToModel(row) {
    if (!row) return null;
    return new LocationModel(row["location_id"], row["location_name"]);
  }

static getAll(sortBy = 'locationName', order = 'asc', filters = {}) {
    const { locationName } = filters;
    const columnMapping = {
        locationName: 'location_name'
    };

    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy) ? sortBy : 'locationName';
    const sortColumnSQL = columnMapping[sortColumnJS];
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let sql = `SELECT * FROM locations`;
    const params = [];

    if (locationName) {
      sql += " WHERE location_name LIKE ?";
      params.push(`%${locationName}%`);
    }

    sql += ` ORDER BY ${sortColumnSQL} ${sortOrder}`;

    return this.query(sql, params).then((results) => {
        if (results.length > 0 && results[0].locations) {
            return results.map((row) => this.tableToModel(row.locations));
        }
        return results.map((row) => this.tableToModel(row));
    });
  }

  static async getById(id) {
    return this.query("SELECT * FROM locations WHERE location_id = ?", [
      id,
    ]).then((result) => {
      if (result.length === 0) {
          return Promise.reject("not found");
      }
      const row = result[0].locations || result[0];
      return this.tableToModel(row);
    });
  }

  static async create(location) {
    return this.query(
      `INSERT INTO locations (location_name) VALUES (?)`,
      [location.locationName]
    );
  }

  static async update(location) {
    return this.query(
      `UPDATE locations SET location_name = ? WHERE location_id = ?`,
      [location.locationName, location.locationId]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM locations WHERE location_id = ?", [id]);
  }
}