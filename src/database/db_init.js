/**
 * 
 * @param {*} db 
 * @returns 
 * 
 * This function creates the tables for the application. Models, Issues, Magazine Section, Articles and the log table.
 * References to choices are irrelevant and there just for reference on how to use.
 * 
 * Exports:
 * - createTables(db)
 * - insertInitialData(db) - Irrelevant, choices related.
 */

function createTables(db) {
    console.log('Creating tables...')
    // Database doesn't exist yet - init tables
    db.exec(
        //     "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
        // );
        `CREATE TABLE Team(id INTEGER PRIMARY KEY, team TEXT);
        
        CREATE TABLE FilmSeries(id INTEGER PRIMARY KEY, series TEXT);
        
        CREATE TABLE Film(id INTEGER PRIMARY KEY, film TEXT, seriesId, FOREIGN KEY(seriesId) REFERENCES FilmSeries(id));
        
        CREATE TABLE Faction(id INTEGER PRIMARY KEY AUTOINCREMENT, faction TEXT, teamId INTEGER, filmId INTEGER, FOREIGN KEY(teamId) REFERENCES Team(id), FOREIGN KEY(filmId) REFERENCES   Film(id));
        
        CREATE TABLE Models (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, modelCount INTEGER, factionId INTEGER, FOREIGN KEY (factionId) REFERENCES Faction(id));
        
        CREATE TABLE Issues (id INTEGER PRIMARY KEY AUTOINCREMENT, issueNumber TEXT, modelId INTEGER, isSpecial BOOLEAN, hasInsert BOOLEAN, FOREIGN KEY(modelId) REFERENCES Models(id));
        
        CREATE TABLE MagazineSection (id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT);
        
        CREATE TABLE Articles (id INTEGER PRIMARY KEY AUTOINCREMENT, article TEXT, pages TEXT, sectionId INTEGER, issueId INTEGER, FOREIGN KEY(sectionId) REFERENCES MagazineSection(id), FOREIGN KEY(issueId) REFERENCES Issue(id));

        CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING);`
    );

    console.log('Database tables created successfully');

    return;
}

// async function insertInitialData(db) {
//     // Add default choices to table
//     db.exec(
//         "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
//     );
// }

module.exports = async function dbInit(db) {
    await createTables(db);
    //await insertInitialData(db);
}