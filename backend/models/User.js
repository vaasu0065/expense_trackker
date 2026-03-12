const pool = require("../config/db");

class User {
  static async create({ name, email, password }) {
    const result = await pool.query(
      "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *",
      [name, email, password]
    );
    return result.rows[0];
  }

  static async findOne({ where }) {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [where.email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
