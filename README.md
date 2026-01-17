# Battle Games in Middle Earth Catalogue
A catalogue of the Battle Games in Middle Earth magazine series along with the topics covered and items included with each issue.

To install run:
`npm install`

Create '.env' file and include a PORT
e.g. `PORT=3000`

Create a folder called `.data` that your local DB will save to.

To start run:
`npm run dev`

## Progress thus-far
The majority of (sporadic) development in 2025 was on ensuring the database content was clean and could be imported each time. It's definitely been over-engineered, this is a personal project though, being fun really was the only reason. There are no more magazines, I could have gone through and just updated the text to standardise it, but where's the joy in that?

As of the end of 2025, the data is all in the database, cleaned and awaiting the next steps:
- The database tables are created.
- The issue list is brought in from a CSV file and converted to JSON.
- The data is cleaned and inserted on the fly:
-- Magazines, models, and magazine sections are put into respective tables
-- The issue list is looped through and assign models to mags. This took a long time due to inconsistencies in naming. For example: Minas Tirith Banner Bearer vs. Warriors of Minas Tirith: the string needed to be split to find like models and then pick out the correct option.
-- The magazine is marked if a Special Edition, if it has a card insert.
-- During the loop the articles that appear in the magazine are inserted to the Articles table along with which pages, issue and section they appear in.

I then refactored this code to make it easier to follow and reusable. I introduced Class constructors for the magazine, enum helpers for the sections and SQLite conditions, and database lookup function.

## Next steps
### Update January 2026
#### API endpoints
Now that the database is built and ready to go I can move my attention to the API endpoints. I want endpoints for:
- List all magazines
- Show a single magazine with all content and figures
- List models
- Show where a model appears in a magazine.

#### Factions
As I'm writing this, I think it would be useful to include the faction that each model applies to. I'll need to:
- Create a Factions table.
- Update the Figures table with a Faction Foreign Key.
- Update the figure insert with to include the faction.

Once this is complete, I'll create endpoints for:
- Listing all factions - Rohan, Gondor, Isengard etc.
- Listing the models for a faction and which magazine they appear in - Isengard: Uruk-hai, Saruman, and so forth.
- Possibly further along, listing magazines against the faction.

#### Design
The design is something I've been putting off. I want it to feel on theme, so checking out the various Tolkien books on my bookshelf, the Warhammer website, and tabletop apps for fantasy games would be a fair place to start for inspiration.

#### Going public
Once the above is complete, I'll start to publise this project to the community. I'll need to think about gathering feedback.

#### User accounts
I want this app/site to be a solid catalogue for the BGiME magazine series. I feel the next steps once this is achieve will be to allow people to save their collection progress:
- Which magazines do I own.
- Which models have I painted.
- What is on my watch list, what do I need to buy?

#### Offline mode
I haven't worked with service workers or HTML storage before, it's been on my to-do list for a long while now, so implementing a service worker to allow offline use of the web-app would be a good opportunity to try this out.

#### Mobile app
As with an offline mode, I've not built a mobile app before. With the API in-place, this could be another good opportunity to explore.