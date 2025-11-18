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
const dbInit = require('./database/db_init.js');
const dbLoader = require('./database/db_loader.js');
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


        // call DB init here
        await dbInit(db); // Create tables
        await dbLoader(db); // Populate tables

      } else {
        // We have a database already - write Choices records to log for info
        console.log('Database exists!')
        console.log(await db.all("SELECT * from Choices"));
        console.log(await db.all("SELECT i.issueNumber, m.name AS 'Model name', m.modelCount from Issues i JOIN Models m ON i.modelId = m.id"));

      }

      /**
       * Loop the issues and insert programmatically
       */
      // Read clean CSV and convert to JSON
      await csvToJson().fromFile(issueListCSV)
        .then(async issuesObj => {
          // Loop through resulting object and filter out any headings and not model entries
          const insertionPromises = issuesObj
            .filter(issue => issue['Figure(s)'] !== '' && issue['Figure(s)'] !== 'Figure(s)')
            .map(async issue => {
              // Find by model name in SQL to get ID
              const figure = issue['Figure(s)']
              let readyForInsert = false
              let cardInsert = false

              // Start with a straight up match with the incoming
              let modelId = await db.get(`SELECT * FROM Models WHERE name == "${figure}"`)
              if (modelId) {
                readyForInsert = true;
              }

              if (!readyForInsert) {
                // Couldn't find a model with this name, try to expand the search...


                // Do specific search if 'None' or 'Banner' or 'Warg' or 'Card' is included (is specific term).
                if (figure.split('None').length > 1) {
                  modelId = { id: null }
                  // Check for a card:
                  if (figure.split('Card').length > 1) {
                    cardInsert = true
                  }
                  readyForInsert = true
                  // end this figure check.
                }
                // Each need checking separately as there could be a banner and an insert
                if (figure.split('Warg').length > 1 && !readyForInsert) {
                  //debugger;
                }
                if (figure.split('Banner').length > 1 && !readyForInsert) {
                  //debugger;
                }
                if (figure.split('Card').length > 1 && !readyForInsert) {
                  cardInsert = true;
                  // This won't work with 8 Gonder and 4 Elves mixed sprue.

                  if (!modelId) {
                    // Step 1: Try to split off card and search for the model including the number of figures:
                    const baseNameWithNumber = figure.split(' + Card')[0]

                    modelId = await db.get(`SELECT * FROM Models WHERE name == "${baseNameWithNumber}" COLLATE NOCASE`);
                    // If we still don't have a model ID...Try fuzzy search with out the preceeding number
                    // Check if needing to remove number...this was causing errors without a check
                    if (!modelId) {
                      const baseNameWithoutNumber = baseNameWithNumber.match(/^(\d+)\s+(.+?)$/)

                      // Check if base name without number actually exists, otherwise skip
                      if (baseNameWithoutNumber) {
                        modelId = await db.get(`SELECT * FROM Models WHERE name LIKE "%${baseNameWithoutNumber[2]}%"`)
                        readyForInsert = modelId ? true : false;
                      }
                    }
                    else {
                      readyForInsert = true;
                    }
                  }
                  let figureMatch;
                  if (!modelId) {
                    figureMatch = figure.match(/^(\d+)\s+(.+?)\s+\+\s+(.+)$/);
                    if (figureMatch) {
                      try {
                        let numOfFigs = figureMatch[1]
                        let nameOfFigs = figureMatch[2]
                        modelId = await db.get(`SELECT * FROM Models WHERE name == "${nameOfFigs}" COLLATE NOCASE`)
                        console.log(nameOfFigs)
                        readyForInsert = modelId ? true : false;
                      } catch (error) {
                        // Need to check for other models here
                        debugger
                      }
                    }
                    else {
                      figureMatch = figure.split(' + Card Insert')
                      if (figureMatch.length > 0) {
                        try {

                          let nameOfFigs = figureMatch[0]
                          modelId = await db.get(`SELECT * FROM Models WHERE name == "${nameOfFigs}" COLLATE NOCASE`); // Collate nocase to match not case senstive
                          console.log('Model ID in inner search: ', modelId);
                          readyForInsert = modelId ? true : false;
                        } catch (error) {
                          debugger
                        }
                      }
                    }
                  }

                  /**
                   * Check to see if this string (that contains the word 'card', has a figure in the DB already):
                   * ^         Matches the beginning of the string.
                   * (\d+)     Matches one or more digits and captures them in group 1 (the number).
                   * \s+       Matches one or more whitespace characters.
                   * (.+?)     Matches one or more of any character (non-greedy) and captures them in group 2 (the text between the number and the '+'). The ? makes it non-greedy, so it stops at the next part of the pattern.
                   * \s+\+\s+  Matches one or more whitespace characters, followed by a literal + sign (which needs to be escaped with a backslash), followed by one or more whitespace characters.
                   * (.+)      Matches one or more of any character until the end of the string and captures them in group 3 (everything after the '+').
                   * $         Matches the end of the string.
                   */



                  // Update the DB if a fig ID has been found
                  // Don't need to do the next part...
                }

                // Still don't have a model to search for:
                if (!modelId && !readyForInsert) {
                  // Split and loop words
                  let reduceFigureNameArr = figure.split(' ')
                  let i = 0;
                  let figWord = null
                  do {
                    if (isNaN(reduceFigureNameArr[i])) {
                      // Add checks for '+', 'Warriors', 'Riders'

                      // Search the db for this value
                      figWord = reduceFigureNameArr[i]
                      modelId = await db.get(`SELECT * FROM Models WHERE name LIKE "%${figWord}%"`)

                      // If rows = 1
                      break;
                    }
                    i++;
                  } while (i < reduceFigureNameArr.length);
                  readyForInsert = modelId ? true : false;
                }

                if (!modelId && !readyForInsert) {
                  // If we still don't have a model...
                  debugger
                }
              }

              // This was the corresponding else to if model undefined. Now it's own thing.
              if (readyForInsert) {
                // insert into Issues(issueNumber, modelID, isSpecial)
                const isSpecial = isNaN(issue['Issue Number']) ? 1 : 0 // If false, 1 (IS a special)
                try {
                  //issueNumber = isSpecial == 1 ? issue['IssueNumber'] : parseInt(issue['Issue Number']) // If it's a special enter as is, if normal parse int to number
                  await db.run(`UPDATE Issues SET modelID = ${modelId.id}, isSpecial = ${isSpecial}, hasInsert = ${cardInsert} WHERE issueNumber = "${issue['Issue Number']}"`)
                } catch (error) {
                  debugger
                }
              }
            })

          await Promise.all(insertionPromises);
        })


      // Then => 
      // Then => Pass model ID along with issue number and isSpecial
      //         If issue number % 0 == false, isSpecial = true

      //If you need to remove a table from the database use this syntax
      //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist

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
      const insertIssue = await (db.run("INSERT INTO Issues(issueNumber, modelId) VALUES (?,?)", [
        issueNumber,
        insertModel.lastID
      ]));

      const pluralModels = modelCount > 1 ? true : false

      console.info(`Inserted issue ${issueNumber} which came with ${modelCount} model${pluralModels ? 's' : ''}`)

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
