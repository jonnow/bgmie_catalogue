
module.exports = {
  selectAllIssues: `
    SELECT    i.id
            , i.issueNumber
            , m.name
            , m.modelCount
            , CASE i.isSpecial 
                WHEN 1 THEN 1
                ELSE 0
              END special
            , CASE i.hasInsert 
                WHEN 1 THEN 1
                ELSE 0
              END hasCard
    FROM Issues i 
    LEFT JOIN Models m 
      ON i.modelId = m.id`,
  selectSingleIssue: `
        SELECT    i.id
                , i.issueNumber
                , m.name
                , m.modelCount
                , CASE i.isSpecial 
                    WHEN 1 THEN 1
                    ELSE 0
                  END special
                , CASE i.hasInsert 
                    WHEN 1 THEN 1
                    ELSE 0
                  END hasCard
        FROM Issues i 
        LEFT JOIN Models m 
          ON i.modelId = m.id
        WHERE i.id = ?`,
  selectSingleIssueArticles: `
            SELECT  a.article
                  , a.pages
                  , ms.section
                  , a.sectionId
            FROM Articles a
            JOIN MagazineSection ms
              ON a.sectionId = ms.id
            JOIN Issues i
              ON a.issueId = i.id
            WHERE a.issueId = ?
          `,
  selectAllModels: `
    SELECT m.*, i.issueNumber
    FROM Models m
    JOIN Issues i
      ON i.modelId = m.id
  `,
  selectAllFactions: `
    SELECT *
    FROM Faction
  `,
  selectSingleFaction: `
    SELECT  fa.id,
            fa.faction,
            t.team,
            fi.film,
            fs.series
    FROM Faction fa
    JOIN Team t
      ON fa.teamId = t.id
    JOIN Film fi
      ON fa.filmId = fi.id
    JOIN FilmSeries fs
      ON fi.seriesId = fs.id
  `,
};