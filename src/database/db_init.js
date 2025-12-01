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

async function createTables(db) {
    console.log('Creating tables...')
    // Database doesn't exist yet - init tables
    // await db.run(
    //     "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
    // );

    await db.run(
        "CREATE TABLE Models (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, modelCount INTEGER)"
    );

    await db.run(
        "CREATE TABLE Issues (id INTEGER PRIMARY KEY AUTOINCREMENT, issueNumber TEXT, modelId INTEGER, isSpecial BOOLEAN, hasInsert BOOLEAN, FOREIGN KEY(modelId) REFERENCES Models(id))"
    );

    await db.run(
        "CREATE TABLE MagazineSection (id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT)"
    )


    await db.run(
        "CREATE TABLE Articles (id INTEGER PRIMARY KEY AUTOINCREMENT, article TEXT, pages TEXT, sectionId INTEGER, issueId INTEGER, FOREIGN KEY(sectionId) REFERENCES MagazineSection(id), FOREIGN KEY(issueId) REFERENCES Issue(id))"
    )

    // Log can start empty - we'll insert a new record whenever the user chooses a poll option
    await db.run(
        "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
    );

    return;
}

// async function insertInitialData(db) {
//     // Add default choices to table
//     await db.run(
//         "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
//     );
// }

module.exports = async function dbInit(db) {
    await createTables(db);
    //await insertInitialData(db);
}