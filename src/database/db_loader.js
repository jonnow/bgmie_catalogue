/**
 * Inserts the initial data for the database from defined SQL files (figures and issues)
 */
const fs = require("fs");

const dbFigures = './.data/insertFigures.sql';
const dbIssues = './.data/insertIssues.sql';
const dbSections = './.data/insertMagazineSections.sql';


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

        const insertSections = fs.readFileSync(dbSections).toString();
        await db.exec(
            insertSections
        );
        console.log('Magazine sections data loaded')
    } catch (error) {
        console.error(`Error loading initial data: ${error}`)
        debugger;
    }
}