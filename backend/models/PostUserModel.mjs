import { DatabaseModel } from "./DatabaseModel.mjs";
import { PostModel } from "./PostModel.mjs";
import { UserModel } from "./UserModel.mjs";

export class PostUserModel extends DatabaseModel {
  constructor(post, user) {
    super();
    this.post = post;
    this.user = user;
  }

  static tableToModel(row) {
    return new PostUserModel(
      PostModel.tableToModel(row.posts),
      UserModel.tableToModel(row.users)
    );
  }

  static getAll() {
    return this.query(
      `
        select * from posts
       inner join users on posts.user_id = users.user_id
       
        `
    ).then((results) => results.map((row) => this.tableToModel(row)));
  }

  static getById(id) {
    return this.query(
      `
          select * from posts
       inner join users on posts.user_id = users.user_id
         where  posts.post_id =  ? 
        `,
      [id]//////filter by postid newcode utk
    ).then((result) =>
      result.length > 0
        ? this.tableToModel(result[0])
        : Promise.reject("not found")
    );
  }

  static async create(postData) {

    const result = await this.query(
      `INSERT INTO posts (user_id, title, content, created_at)
         VALUES (?, ?, ?, ?)`,
      [postData.userId, postData.title, postData.content, postData.createdAt]
    );

    const insertedPostId = result.insertId;


    const rows = await this.query(
      `
        SELECT * 
        FROM posts
        INNER JOIN users ON posts.user_id = users.user_id
        WHERE posts.post_id = ?
        `,
      [insertedPostId]
    );

    if (rows.length === 0) {
      return Promise.reject("Post creation failed");
    }

    return this.tableToModel(rows[0]);
  }
}

