import { DatabaseModel } from "./DatabaseModel.mjs";

export class UserModel extends DatabaseModel {
  constructor(userId, firstName, lastName, role, username, password, phone) {
    super();
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.username = username;
    this.password = password;
    this.phone = phone; 
  }

  static tableToModel(row) {
    if (!row) return new UserModel(null, "", "", "", "", "", "");
    return new UserModel(
      row["user_id"],
      row["first_name"],
      row["last_name"],
      row["role"],
      row["username"],
      row["password"],
      row["phone"]
    );
  }

  static async getAll(sortBy = 'lastName', order = 'asc') {
   
    const columnMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      username: 'username',
      role: 'role'
    };

   
    const validSortColumns = Object.keys(columnMapping);
    const sortColumnJS = validSortColumns.includes(sortBy) ? sortBy : 'lastName';
    const sortColumnSQL = columnMapping[sortColumnJS]; 
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const sql = `SELECT * FROM users ORDER BY ${sortColumnSQL} ${sortOrder}`;
    

    return this.query(sql).then((results) =>
      results.map((row) => this.tableToModel(row.users))
    );
  }

  static async getById(id) {
    return this.query("SELECT * FROM users WHERE user_id = ?", [id]).then(
      (result) =>
        result.length > 0
          ? this.tableToModel(result[0].users)
          : Promise.reject("not found")
    );
  }

  static async getByUsername(username) {
    return this.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]).then((result) =>
      result.length > 0
        ? this.tableToModel(result[0].users)
        : Promise.reject("not found")
    );
  }

  static async create(user) {
    return this.query(
      `INSERT INTO USERS (first_name, last_name, role, username, password, phone)
       VALUES(?, ?, ?, ?, ?, ?)`,
      [
        user.firstName,
        user.lastName,
        user.role,
        user.username,
        user.password,
        user.phone,
      ]
    );
  }

  static async update(user) {
    if (user.password) {
      return this.query(
        `UPDATE USERS 
         SET first_name = ?, last_name = ?, role = ?, username = ?, password = ?, phone = ?
         WHERE user_id = ?`,
        [
          user.firstName, user.lastName, user.role, user.username, 
          user.password, user.phone, user.userId
        ]
      );
    } else {
      return this.query(
        `UPDATE USERS 
         SET first_name = ?, last_name = ?, role = ?, username = ?, phone = ?
         WHERE user_id = ?`,
        [
          user.firstName, user.lastName, user.role, user.username, 
          user.phone, user.userId
        ]
      );
    }
  }

  static async delete(id) {
    return this.query("DELETE FROM USERS WHERE user_id = ?", [id]).then(
      (result) =>
        result.affectedRows > 0 ? result : Promise.reject("not found")
    );
  }

  static async getAllTrainers() {
    return this.query("SELECT * FROM users WHERE role = 'trainer' ORDER BY first_name ASC")
      .then((results) =>
        results.map((row) => this.tableToModel(row.users))
      );
  }
}