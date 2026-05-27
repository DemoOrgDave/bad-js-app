
const insertRecord = async (req,res) => {


  const mysql = require('mysql2/promise');
  import { escape } from 'mysql2'
  const escape1 = require('mysql').escape
  // create the connection to database
  const connection = await mysql.createConnection();
  
let email = req.body['email'];
  let statement = 'INSERT INTO entries(RecordNumber,CustomerName,Email,Phone,Stat,RAWS3URL) VALUES("00000","NAME","' + escape(email) + '","000-000-0000",0,"http://");'
let statement1 = 'INSERT INTO entries(RecordNumber,CustomerName,Email,Phone,Stat,RAWS3URL) VALUES("00000","NAME","' + email + '","000-000-0000",0,"http://");'
let statement2 = 'INSERT INTO entries(RecordNumber,CustomerName,Email,Phone,Stat,RAWS3URL) VALUES("00000","NAME","' + escape1(email) + '","000-000-0000",0,"http://");'
  // ruleid: express-mysql-sqli
  const [rows,fields] = await connection.execute(statement1);
  // ok: express-mysql-sqli
  const [rows,fields] = await connection.execute(statement2);

  let conn1 = mysql.createConnection();
 conn1.connect(function (error) {
       // ruleid: express-mysql-sqli
       conn1.query(statement1);
       // ok: express-mysql-sqli
       conn1.query(statement);
  })

  const pool = mysql.createPool({host:'localhost', user: 'root', database: 'test'});
  const promisePool = pool.promise();
  // ruleid: express-mysql-sqli
  const [rows,fields] = await promisePool.query(statement1);
  // ok: express-mysql-sqli
   const [rows,fields] = await promisePool.query(statement2);

};



