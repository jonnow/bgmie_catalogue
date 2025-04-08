/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");
const fsPromises = require('node:fs/promises');
const csvToJson = require("csvtojson");

// Initialize the database
const dbFile = "./.data/choices.db";
const dbFigures = './.data/insertFigures.sql';
const dbIssues = './.data/insertIssues.sql';
const issueListCSV = './.data/BGiME_issue_list.csv';
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;



/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Read contents of any scripts
        const insertFiguresScript = fs.readFileSync(dbFigures).toString();
        const insertIssuesScript = fs.readFileSync(dbIssues).toString();
        
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
        );

        await db.run(
          "CREATE TABLE Models (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, modelCount INTEGER)"
        );

        await db.run(
          "CREATE TABLE Issues (id INTEGER PRIMARY KEY AUTOINCREMENT, issueNumber TEXT, modelId INTEGER, isSpecial BOOLEAN, FOREIGN KEY(modelId) REFERENCES Models(id))"
        );

        await db.run(
          "CREATE TABLE MagazineSection (id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT)"
        )

        
        await db.run(
          "CREATE TABLE Articles (id INTEGER PRIMARY KEY AUTOINCREMENT, article TEXT)"
        )


        // Add default choices to table
        await db.run(
          "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
        );
        
        await db.exec(
          insertFiguresScript
        );

        await db.exec(
         insertIssuesScript
        );


        // Log can start empty - we'll insert a new record whenever the user chooses a poll option
        await db.run(
          "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
        );
      } else {
        // We have a database already - write Choices records to log for info
        console.log('Database exists!')
        console.log(await db.all("SELECT * from Choices"));
        console.log(await db.all("SELECT i.issueNumber, m.name AS 'Model name', m.modelCount from Issues i JOIN Models m ON i.modelId = m.id"));

        // Loop the issues and insert programmatically
        
        // Read clean CSV and convert to JSON
        csvToJson().fromFile(issueListCSV)
          .then(issuesObj => {
            // Loop through resulting object and filter out any headings and not model entries
            issuesObj
              .filter(issue => issue['Figure(s)'] !== '' && issue['Figure(s)'] !== 'Figure(s)')
              .map(async issue => {
                // Find by model name in SQL to get ID
                const figure = issue['Figure(s)']
                
                let modelId = await db.get(`SELECT * FROM Models WHERE name == "${figure}"`)
                
                if(modelId == undefined) {
                  // Couldn't find a model with this name, try to expand the search...


                  // Do specific search if 'Banner' or 'Warg' is included (is specific term)
                  if(figure.split('Warg').length > 1) {
                    debugger;
                   
                  }
                  else if(figure.split('Banner').length > 1) {
                    debugger;
                  }

                  // Split and loop words
                  let reduceFigureNameArr = figure.split(' ')
                  let i = 0;
                  let figWord = null
                  do {
                    if(isNaN(reduceFigureNameArr[i])) {
                      // Add checks for '+', 'Warriors', 'Riders'


                      // Search the db for this value
                      figWord = reduceFigureNameArr[i]
                      modelId = await db.get(`SELECT * FROM Models WHERE name LIKE "%${figWord}%"`)

                      // If rows = 1
                      debugger
                      break;
                    }
                    i++;
                  } while (i < reduceFigureNameArr.length);
                  
                }
                else {
                  // insert into Issues(issueNumber, modelID, isSpecial)
                }
                
              })
          })
          
        
        // Then => 
        // Then => Pass model ID along with issue number and isSpecial
        //         If issue number % 0 == false, isSpecial = true

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  
  /**
   * Get the options in the database
   *
   * Return everything in the Choices table
   * Throw an error in case of db connection issues
   */
  getOptions: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  /**
   * Process a user vote
   *
   * Receive the user vote string from server
   * Add a log entry
   * Find and update the chosen option
   * Return the updated list of votes
   */
  processVote: async vote => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      // Check the vote is valid
      const option = await db.all(
        "SELECT * from Choices WHERE language = ?",
        vote
      );
      if (option.length > 0) {
        // Build the user data from the front-end and the current time into the sql query
        await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
          vote,
          new Date().toISOString()
        ]);

        // Update the number of times the choice has been picked by adding one to it
        await db.run(
          "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
          vote
        );
      }

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * 
   * Add a magazine to catalogue 
   * 
   */
  upsertIssue: async (issueNumber, modelName, modelCount) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
        // Insert model
        const insertModel = await db.run("INSERT INTO Models(name, modelCount) VALUES (?, ?)", [
          modelName, modelCount
        ]);
        
        // Insert issue
        const insertIssue = await(db.run("INSERT INTO Issues(issueNumber, modelId) VALUES (?,?)", [
          issueNumber,
          insertModel.lastID
        ]));

        const pluralModels = modelCount > 1 ? true : false

        console.info(`Inserted issue ${issueNumber} which came with ${modelCount} model${pluralModels ? 's':''}`)
        
        // Build the user data from the front-end and the current time into the sql query
        // await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
        //   vote,
        //   new Date().toISOString()
        // ]);

        // Update the number of times the choice has been picked by adding one to it
        // await db.run(
        //   "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
        //   vote
        // );

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Models");
    } catch (dbError) {
      console.error(dbError);
      debugger
    }
  },

  /**
   * Get logs
   *
   * Return choice and time fields from all records in the Log table
   */
  getLogs: async () => {
    // Return most recent 20
    try {
      // Return the array of log entries to admin page
      return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Clear logs and reset votes
   *
   * Destroy everything in Log table
   * Reset votes in Choices table to zero
   */
  clearHistory: async () => {
    try {
      // Delete the logs
      await db.run("DELETE from Log");

      // Reset the vote numbers
      await db.run("UPDATE Choices SET picks = 0");

      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  }
};
