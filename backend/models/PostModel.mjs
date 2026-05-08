import { DatabaseModel } from "./DatabaseModel.mjs";
import { UserModel } from "./UserModel.mjs";

export class PostModel extends DatabaseModel {
    constructor(postId, userId, title, content, createdAt) {
        super();
        this.postId = postId;
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
    }

    static tableToModel(row) {
        return new PostModel(
            row["post_id"],
            row["user_id"],
            row["title"],
            row["content"],
            row["created_at"]
        );
    }
    
static getAllWithAuthors(sortBy = 'createdAt', order = 'desc', filters = {}) {
        const { author, title, content, date } = filters;
        const columnMapping = {
            author: 'users.first_name',
            title: 'posts.title',
            createdAt: 'posts.created_at'
        };

        const validSortColumns = Object.keys(columnMapping);
        const sortColumnJS = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
        const sortColumnSQL = columnMapping[sortColumnJS];
        const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        let sql = `
            SELECT * FROM posts
            INNER JOIN users ON posts.user_id = users.user_id
        `;

        const whereClauses = [];
        const params = [];

        if (author) {
            whereClauses.push("CONCAT(users.first_name, ' ', users.last_name) LIKE ?");
            params.push(`%${author}%`);
        }
        if (title) {
            whereClauses.push("posts.title LIKE ?");
            params.push(`%${title}%`);
        }
        if (content) {
            whereClauses.push("posts.content LIKE ?");
            params.push(`%${content}%`);
        }
        if (date) {
            whereClauses.push("DATE(posts.created_at) = ?");
            params.push(date);
        }

        if (whereClauses.length > 0) {
            sql += " WHERE " + whereClauses.join(" AND ");
        }

        sql += ` ORDER BY ${sortColumnSQL} ${sortOrder}`;

        return this.query(sql, params).then(results => {
            return results.map(row => ({
                post: this.tableToModel(row.posts),
                user: UserModel.tableToModel(row.users)
            }));
        });
    }


     static getById(id) {
        return this.query("SELECT * FROM posts WHERE post_id = ?", [id])
            .then((result) =>
                result.length > 0
                    ? this.tableToModel(result[0].posts)
                    : Promise.reject("not found")
            );
    }

    static async create(post) {
        return this.query(
            `INSERT INTO posts (user_id, title, content, created_at)
             VALUES(?, ?, ?, ?)`,
            [post.userId, post.title, post.content, post.createdAt]
        );
    }

    static async update(post) {
        return this.query(`
            UPDATE posts 
            SET title = ?, content = ?
            WHERE post_id = ?`,
            [post.title, post.content, post.postId]
        );
    }

    static async delete(id) {
        return this.query("DELETE FROM posts WHERE post_id = ?", [id])
            .then(result => result.affectedRows > 0 ? result : Promise.reject("not found"));
    }

    static getByUserId(userId, sortBy = 'createdAt', order = 'desc') {
        const columnMapping = {
            title: 'title',
            createdAt: 'created_at'
        };
        const validSortColumns = Object.keys(columnMapping);
        const sortColumnJS = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
        const sortColumnSQL = columnMapping[sortColumnJS];
        const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const sql = `
            SELECT * FROM posts 
            WHERE user_id = ? 
            ORDER BY ${sortColumnSQL} ${sortOrder}
        `;
        return this.query(sql, [userId])
            .then(results => results.map(row => this.tableToModel(row.posts)));
    }
}