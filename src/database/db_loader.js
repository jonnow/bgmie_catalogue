/**
 * Inserts the initial data for the database from defined SQL files (figures and issues)
 */
const fs = require("fs");

const dbFigures = './.data/insertFigures.sql';
const dbIssues = './.data/insertIssues.sql';


module.exports = async function insertData(db) {
    try {
        const insertFiguresScript = fs.readFileSync(dbFigures).toString();
        await db.exec(
            insertFiguresScript
        );
        console.log('Figure data loaded.')
    
        const insertIssuesScript = fs.readFileSync(dbIssues).toString();
        await db.exec(
            insertIssuesScript
        );
        console.log('Issues data loaded.')
    } catch (error) {
        console.error(`Error loading initial data: ${error}`)
        debugger;
    }
}