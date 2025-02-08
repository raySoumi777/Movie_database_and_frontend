const express = require('express');
const path = require('path');//so that backend can use frontend

const app = express();
const db = require('./db');//connection to database
const bodyParser = require('body-parser');
const { isNull } = require('util');
//getting access to FrontEnd Folder
var act=0,quote=0,dir=0;
app.use(express.static(path.join(__dirname,'../frontend')));
app.use(express.json());
//Index page load
app.get('/',(req,res)=>{
    res.sendFile('/index.html');
});

//middleware
app.use(bodyParser.urlencoded({extended : true}));
//add movie
app.post('/addMovie',(req,res)=>{
    const {title,length,plot,productionCompany,genre,year}= req.body;
    console.log(title);
    db.beginTransaction((err)=>{
        if(err) throw err;
        const sqlQuery = 'insert into movie (m_title,Duration,plot,Production_name,YOR) values (?,?,?,?,?)';
        db.query(sqlQuery,[title,length,plot,productionCompany,year],(err,result)=>{
            if(err){
                return db.rollback(()=>{
                    throw err;
                });
            }
        });
        
        const sql = 'insert into movie_category (g_id,m_title) values (?,?)';
        db.query(sql,[genre,title],(err,result)=>{
            if(err){
                return db.rollback(()=>{
                    throw err;
                });
            }
            db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: 'Error committing transaction' });
                  });
                }
                res.json({ success: true, message: 'Movie added successfully' });
              });
        });
    });

});


//addactor
app.post('/addActor',(req,res)=>{
  console.log("hello")
  const { actorname, dob, movies } = req.body;
  console.log("Received actor data:", { actorname, dob, movies });

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: 'Transaction error' });
    }

    const aid = "a" + (++act);
    const sqlQuery = 'INSERT INTO actor (a_id, a_name, DOB, d_id) VALUES (?, ?, ?, NULL)';
    
    db.query(sqlQuery, [aid, actorname, dob], (err, result) => {
      if (err) {
        console.error("Error inserting actor:", err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Error inserting actor' });
        });
      }

      const quoteInsertPromises = movies.map(movie => {
        return new Promise((resolve, reject) => {
          const qid = "q" + (++quote);
          const sql = 'INSERT INTO quote (q_id, m_title, quote,a_id, role) VALUES (?, ?, ?, ?,?)';
          db.query(sql, [qid, movie.movie, movie.quote, aid,movie.role], (err, result) => {
            if (err) {
              console.error("Error inserting quote:", err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      });

      Promise.all(quoteInsertPromises)
        .then(() => {
          db.commit((err) => {
            if (err) {
              console.error("Commit error:", err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Error committing transaction' });
              });
            }
            res.json({ success: true, message: 'Actor added successfully' });
          });
        })
        .catch(err => {
          console.error("Error in quote insertion:", err);
          db.rollback(() => {
            res.status(500).json({ error: 'Error inserting quotes' });
          });
        });
    });
  });

});

//add director
app.post('/addDirector', (req, res) => {
  const {directorName,directorDOB,movies} = req.body;
  console.log('Received form data:', directorName);
  db.beginTransaction((err)=>{
    const did="d"+(++dir);
    const sqlQuery="Insert into Director (d_id,d_name,DOB) values (?,?,?)";
    db.query(sqlQuery,[did,directorName,directorDOB],(err,result)=>{
      if (err) {
        console.error("Error inserting actor:", err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Error inserting actor' });
        });
      }
      const actorPromises = movies.map(movies =>{
        return new Promise((resolve, reject)=>{
          if(movie.isActor==true){
            const aid = "a" + (++act);
            const sql = 'INSERT INTO actor (a_id, a_name, DOB, d_id) VALUES (?, ?, ?, ?)';
            db.query(sql,[aid,directorName,directorDOB,did],(err,result)=>{
              if (err) {
                console.error("Error inserting quote:", err);
                reject(err);
              } else {
                resolve(result);
              }
              if(!movie.quote.isNull){
                const qid = "q" + (++quote);
                const sql2 = 'INSERT INTO quote (q_id, m_title, quote,a_id, role) VALUES (?, ?, ?, ?,?)';
                db.query(sql2,[qid,movie.name,movie.quote,aid,movie.role],(err,result)=>{
                  if (err) {
                    console.error("Error inserting quote:", err);
                    reject(err);
                  } else {
                    resolve(result);
                  }
      
                });
              }
            });
          
          }
        });
      });
      Promise.all(quoteInsertPromises)
      .then(() => {
        db.commit((err) => {
          if (err) {
            console.error("Commit error:", err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Error committing transaction' });
            });
          }
          res.json({ success: true, message: 'Actor added successfully' });
        });
      })
      .catch(err => {
        console.error("Error in quote insertion:", err);
        db.rollback(() => {
          res.status(500).json({ error: 'Error inserting quotes' });
        });

      });

    });
  });
  
  res.json({ message: 'Data received successfully' });
});

//production company
app.get('/api/options', (req, res) => {
    const query = 'SELECT P_name FROM production_company';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching options:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });

//genre fetch
  app.get('/api/option', (req, res) => {
    const query = 'SELECT * FROM genre';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching options:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });
//movie fetch
app.get('/api/movies', (req, res) => {
  const query = 'SELECT m_title FROM movie';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching movies:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

  app.listen(5000,()=>{
    console.log('Server started');
});