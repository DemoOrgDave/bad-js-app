const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mysql = require("mysql2");

const mysqlPromis = require("mysql2/promise"); // Use promise-based mysql2

// Setup database connection (using mysql for this example)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "testdb",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

// Define GraphQL schema
const schema = buildSchema(`
  type Query {
    user(id: String): User
  }

  type User {
    id: String
    name: String
    email: String
  }
`);

const root = {
  user: ({ id }) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE id = '${id}'`; // Vulnerable to SQL Injection
      console.log("Generated SQL Query:", query);
      /*
Run the following to exploit (set up DB first):

curl -X POST http://localhost:4000/graphql \
-H "Content-Type: application/json" \
-d "{\"query\": \"{ user(id: \\\"1' OR '1'='1\\\") { id name email } }\"}"
*/

      // graphQL not currently covered by sources/propagators, we might want engine support for this
      // protodoruleide: mysql-express
      db.query(query, (err, result) => {
        if (err) reject(err);
        console.log("Returned number of rows:", result.length); // Log query for debugging
        resolve(result[0]);
      });
    });
  },
};

// Setup Express and GraphQL
const app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }),
);

// New route with SQL injection vulnerability (non-GraphQL)
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const vulnerableQuery = `SELECT * FROM users WHERE id = '${userId}'`;
  // proruleid: mysql-express
  db.query(vulnerableQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const escapedQuery = `SELECT * FROM users WHERE id = ${mysql.escape(userId)}`;
  // ok: mysql-express
  db.query(escapedQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const escapedConnectionQuery = `SELECT * FROM users WHERE id = ${db.escape(
    userId,
  )}`;
  // ok: mysql-express
  db.query(escapedConnectionQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const placeholderQuery = `SELECT * FROM users WHERE id = ?`;
  // ok: mysql-express
  db.query(placeholderQuery, [userId], (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const formattedQuery = mysql.format(`SELECT * FROM users WHERE id = ?`, [
    userId,
  ]);
  // ok: mysql-express
  db.query(formattedQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const escapedIdQuery = `SELECT * FROM users ORDER_BY ${mysql.escapeId(
    req.params.columname,
  )}`;
  // ok: mysql-express
  db.query(escapedIdQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const columnPlaceholderQuery = `SELECT * FROM users ORDER_BY ??`;
  // ok: mysql-express
  db.query(columnPlaceholderQuery, [req.params.columname], (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  db.config.queryFormat = function (query, values) {
    if (!values) return query;
    return query.replace(
      /\:(\w+)/g,
      function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key]);
        }
        return txt;
      }.bind(this),
    );
  };

  // ok: mysql-express
  db.query("UPDATE posts SET title = :title", { title: "Hello MySQL" });
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const rawQuery = mysql.raw(`SELECT * FROM users WHERE id = '${userId}'`);
  // proruleid: mysql-express
  db.query(rawQuery.sql, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const tpRawQuery = `SELECT * FROM users WHERE id = ${mysql.raw(userId)}`;
  // proruleid: mysql-express
  db.query(tpRawQuery, (err, result) => {});
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE id = '${userId}'`; // Vulnerable to SQL Injection
  console.log("Generated SQL Query:", query);

  // proruleid: mysql-express
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Database query failed");
      return;
    }
    if (result.length > 0) {
      res.json(result[0]); // Return the first matching user
    } else {
      res.status(404).send("User not found");
    }
  });
});

const pool = mysqlPromis.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "testdb",
});

app.get("/async-user/:id", async (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE id = '${userId}'`; // Vulnerable to SQL Injection
  console.log("Generated SQL Query:", query);

  try {
    // proruleid: mysql-express
    const [rows] = await pool.executeAsync(query);
    if (rows.length > 0) {
      res.json(rows[0]); // Return the first matching user
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(500).send("Database query failed");
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
