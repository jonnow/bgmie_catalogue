/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const { condition, sections } = require('./helpers/enums.js');

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
const { ReadyForInsert } = require("./database/db_insert.js");
const dbInsert = require('./database/db_insert.js').ReadyForInsert;
const Magazine = require('./models/magazine.js');
const { notEqual } = require("node:assert");
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
        console.log('Database exists!');
        console.log(await db.all("SELECT i.issueNumber, m.name AS 'Model name', m.modelCount from Issues i JOIN Models m ON i.modelId = m.id"));
      }

      /**
       * Loop the issues and insert programmatically
      */
      // Read clean CSV and convert to JSON
      const issuesObj = await csvToJson().fromFile(issueListCSV);

      // Filter down to just figures and insert these
      const issuesFiltered = issuesObj
        .filter(issue => issue['Figure(s)'] !== '' && issue['Figure(s)'] !== 'Figure(s)')

      for (const issue of issuesFiltered) {
        const magazine = new Magazine();
        // Find by model name in SQL to get ID
        const figure = issue['Figure(s)']
        let readyForInsert = false, figureLookup = {}

        magazine.issueNumber = issue['Issue Number']

        figureLookup = await findModel(figure);
        magazine.cardInsert = figureLookup.cardInsert;
        magazine.model = figureLookup.model;
        readyForInsert = figureLookup.readyForInsert;
        // Moved to the above function
        /*
        // Start with a straight up name match with the incoming
        magazine.model = await searchDBForModel(figure);

        if (magazine.model) {
          readyForInsert = true;
        }

        if (!readyForInsert) {
          // Couldn't find a model with this name, try to expand the search...
          // Do specific search if 'None' or 'Banner' or 'Warg' or 'Card' is included (is specific term).
          if (figure.split('None').length > 1) {
            // No need to set this as we construct as null
            //modelId = { id: null }
            // Check for a card:
            if (figure.split('Card').length > 1) {
              magazine.cardInsert = true
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
            magazine.cardInsert = true;

            // This won't work with 8 Gonder and 4 Elves mixed sprue.
            if (!magazine.model) {
              // Step 1: Try to split off card and search for the model including the number of figures:
              const baseNameWithNumber = figure.split(' + Card')[0]

              debugger
              magazine.model = await searchDBForModel(baseNameWithNumber)
              //db.get(`SELECT * FROM Models WHERE name == "${baseNameWithNumber}" COLLATE NOCASE`);
              //magazine.model = await db.get(`SELECT * FROM Models WHERE name == "${baseNameWithNumber}" COLLATE NOCASE`);
              // If we still don't have a model ID...Try fuzzy search with out the preceeding number
              // Check if needing to remove number...this was causing errors without a check
              if (!magazine.model) {
                const baseNameWithoutNumber = baseNameWithNumber.match(/^(\d+)\s+(.+?)$/)

                // Check if base name without number actually exists, otherwise skip
                if (baseNameWithoutNumber) {
                  magazine.model = await searchDBForModel(baseNameWithoutNumber[2], condition.like)
                  readyForInsert = magazine.model.id ? true : false;
                }
              }
              else {
                readyForInsert = true;
                return
              }
            }
            let figureMatch;
            if (!magazine.model) {
              figureMatch = figure.match(/^(\d+)\s+(.+?)\s+\+\s+(.+)$/);
              if (figureMatch) {
                try {
                  let numOfFigs = figureMatch[1]
                  let nameOfFigs = figureMatch[2]
                  magazine.model = await searchDBForModel(nameOfFigs)
                  console.log(nameOfFigs)
                  readyForInsert = magazine.model ? true : false;
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
                    magazine.model = await searchDBForModel(nameOfFigs)
                    //magazine.model = await db.get(`SELECT * FROM Models WHERE name == "${nameOfFigs}" COLLATE NOCASE`); // Collate nocase to match not case senstive
                    console.log('Model ID in inner search: ', magazine.model);
                    readyForInsert = magazine.model ? true : false;
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

        // Still don't have a model to search for:
        if (!magazine.model && !readyForInsert) {
          // Split and loop words
          let reduceFigureNameArr = figure.split(' ')
          let i = 0;
          let figWord = null
          do {
            if (isNaN(reduceFigureNameArr[i])) {
              // Add checks for '+', 'Warriors', 'Riders'

              // Search the db for this value
              figWord = reduceFigureNameArr[i]
              magazine.model = await searchDBForModel(figWord, condition.like)
              //magazine.model = await db.get(`SELECT * FROM Models WHERE name LIKE "%${figWord}%"`)
              // If rows = 1
            }
            i++;
          } while (i < reduceFigureNameArr.length);
          readyForInsert = magazine.model ? true : false;
        }

        if (!magazine.model && !readyForInsert) {
          // If we still don't have a model...
          debugger
        }


        // Check for card insert, moved from above
        // if (figure.split('Card').length > 1) {
        //   magazine.cardInsert = true
        // }


        // This was the corresponding else to if model undefined. Now it's own thing.
        if (readyForInsert) {

          // insert into Issues(issueNumber, modelID, isSpecial)
          magazine.isSpecial = isNaN(magazine.issueNumber) ? 1 : 0 // If false, 1 (IS a special)
          try {
            //issueNumber = isSpecial == 1 ? issue['IssueNumber'] : parseInt(issue['Issue Number']) // If it's a special enter as is, if normal parse int to number
            await db.run(`UPDATE Issues SET modelID = ${magazine.model?.id == undefined ? null : magazine.model.id}, isSpecial = ${magazine.isSpecial}, hasInsert = ${magazine.cardInsert} WHERE issueNumber = "${magazine.issueNumber}"`)
          } catch (error) {
            debugger
          }
        }
      }

      // Loop everything in the issuesObj and insert the articles
      for (const issue of issuesObj) {
        // Insert magazine sections
        insertArticles(issue);
      }
    } catch (ex) {
      console.log(ex)
      debugger
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

async function searchDBForModel(searchItem, searchType = condition.eq,) {
  var searchResult = await db.get(`SELECT * FROM Models WHERE name ${searchType} "${searchType == condition.like ? '%' : ''}${searchItem}${searchType == condition.like ? '%' : ''}" COLLATE NOCASE`)
  return searchResult
}

async function findModel(figure) {
  // To do: 
  // - Move the model matching to here
  // - Update the return to return readyForInsert as True?
  // - Make sure model Class is being updated in this function
  let lookupObj = { 'model': null, 'cardInsert': null, 'readyForInsert': false }

  // Check for no model magazine
  if (figure.split('None').length > 1) {
    // Figure null by default

    // Check for a card:
    if (figure.split('Card').length > 1) {
      lookupObj.cardInsert = true
    }
    lookupObj.readyForInsert = true
    return lookupObj // Returns null, no figure
  }


  // Initial, basic search
  dbFigure = await searchDBForModel(figure);

  // If we find a model, return it
  if (dbFigure) {
    lookupObj.model = dbFigure
    lookupObj.readyForInsert = true
    return lookupObj
  }

  // Otherwise we carry on...

  // Former if wrapper:

  // Couldn't find a model with this name, try to expand the search...
  // Do specific search if 'None' or 'Banner' or 'Warg' or 'Card' is included (is specific term).

  // Each need checking separately as there could be a banner and an insert
  if (figure.split('Warg').length > 1) {
    //debugger;
  }
  if (figure.split('Banner').length > 1) {
    //debugger;
  }

  // I think I can get rid of this if, keep what's inside though. We shouldn't need it because the return will have happened already if it matches
  //if (figure.split('Card').length > 1) {
  //magazine.cardInsert = true;

  // This won't work with 8 Gonder and 4 Elves mixed sprue.
  //if (!magazine.model) {
  // Step 1: Try to split off card and search for the model including the number of figures:
  const baseNameWithNumber = figure.split(' + Card')[0]

  lookupObj.model = await searchDBForModel(baseNameWithNumber)

  // If we find something, return it, otherwise carry on
  if (dbFigure) {
    return lookupObj
    // or should this be:
    // return readyForInsert = true?
  }


  //db.get(`SELECT * FROM Models WHERE name == "${baseNameWithNumber}" COLLATE NOCASE`);
  //magazine.model = await db.get(`SELECT * FROM Models WHERE name == "${baseNameWithNumber}" COLLATE NOCASE`);
  // If we still don't have a model ID...Try fuzzy search with out the preceeding number
  // Check if needing to remove number...this was causing errors without a check
  //if (!magazine.model) {
  const baseNameWithoutNumber = baseNameWithNumber.match(/^(\d+)\s+(.+?)$/)

  // Check if base name without number actually exists, otherwise skip
  if (baseNameWithoutNumber) {
    lookupObj.model = await searchDBForModel(baseNameWithoutNumber[2], condition.like)
    lookupObj.readyForInsert = lookupObj.model?.id ? true : false;
    return lookupObj
  }
  //}
  //}
  let figureMatch;
  //if (!magazine.model) {
  figureMatch = figure.match(/^(\d+)\s+(.+?)\s+\+\s+(.+)$/);
  if (figureMatch) {
    try {
      let numOfFigs = figureMatch[1]
      let nameOfFigs = figureMatch[2]
      lookupObj.model = await searchDBForModel(nameOfFigs)
      console.log(nameOfFigs)
      lookupObj.readyForInsert = lookupObj.model ? true : false;
      if (readyForInsert) {
        return lookupObj
      }
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
        lookupObj.model = await searchDBForModel(nameOfFigs)
        //magazine.model = await db.get(`SELECT * FROM Models WHERE name == "${nameOfFigs}" COLLATE NOCASE`); // Collate nocase to match not case senstive
        console.log('Model ID in inner search: ', lookupObj.model);
        lookupObj.readyForInsert = lookupObj.model ? true : false;
        if (lookupObj.readyForInsert) {
          return lookupObj
        }
      } catch (error) {
        debugger
      }
    }
  }
  //}

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

  // former end of if

  // Still don't have a model to search for:
  //if (!magazine.model && !readyForInsert) {
  // Split and loop words
  let reduceFigureNameArr = figure.split(' ')
  let i = 0;
  let figWord = null
  do {
    if (isNaN(reduceFigureNameArr[i])) {
      // Add checks for '+', 'Warriors', 'Riders'

      // Search the db for this value
      figWord = reduceFigureNameArr[i]
      lookupObj.model = await searchDBForModel(figWord, condition.like)
      if (lookupObj.model) {
        // Not sure if this needs to be a break or a return to get back to the main function
        return lookupObj;
        break;
      }
    }
    i++;
  } while (i < reduceFigureNameArr.length);

  lookupObj.readyForInsert = lookupObj.model ? true : false;
  //}

  if (!lookupObj.model && !lookupObj.readyForInsert) {
    // If we still don't have a model...
    debugger
  }
  //}

  return lookupObj
}


// Load sections from database.

// For each entry, pull out the article title and match to a section 
function insertArticles(issueData) {
  if (issueData['Article Title'] != '' && issueData['Article Title'] != 'Article Title') {

    const article = issueData['Article Title']
    const pages = issueData["Page No's"]
    const sectionId = sections[issueData['Magazine Section']]

    // Insert into the Articles table
    db.run("INSERT INTO Articles (article, pages, sectionId) VALUES (?, ?, ?)", [
      article,
      pages,
      sectionId
    ]);
  }

  return
}


// const correspondingKey = arrayOfKeys.find((title) => movies[title] === "Steven Spielberg");

// console.log(correspondingKey);
// Logs to the console: "Jaws"