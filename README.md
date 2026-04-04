<https://hunternbh.github.io/acc3202-sql/>

PostgreSQL / SQL Exercises (Browser DB)
ACC3202 — Designed by Hunter Ng

----------------------------------------------------------------------

Overview
----------------------------------------------------------------------

This website provides an interactive, browser-based SQL environment
using sql.js (SQLite compiled to WebAssembly). Students can load a
database, run SQL queries directly in the browser, browse the schema,
and complete guided exercises. The platform is designed for ACC3202
and other accounting/finance information-systems courses that require
hands-on SQL practice without installing any software.

----------------------------------------------------------------------

Features
----------------------------------------------------------------------

- Runs SQL queries fully in the browser (client-side only).
- Loads a .db file using sql.js; no server or backend required.
- Query editor: write SQL and press Ctrl/Command + Enter to run.
- Results pane shows query output.
- Schema Browser displays table structures and views.
- Exercises section with scoring and progress tracking.
- Instructor / Seed / Build modes for refreshing or regenerating data.
- Mobile-friendly UI; works on desktop and mobile.
- Supports downloading the database for offline use.

----------------------------------------------------------------------

Usage
----------------------------------------------------------------------

1. Load Database
   - Use the "Load default" or "Fetch URL" options to load the provided
     .db file.
   - Once loaded, all tables and views appear in the Schema Browser.

2. Write & Run Queries
   - Type SQL statements in the Editor.
   - Press Ctrl/Command + Enter to execute.
   - Multiple statements are allowed if separated by semicolons.

3. View Schema
   - Check table names, columns, and view definitions in the Schema
     Browser.

4. Exercises & Scoring
   - Use the "Exercises" tab for guided tasks.
   - Run your query and view correctness/progress.

5. Download / Offline Practice
   - The "Download DB" button lets you save the database locally.

6. Build / Seed / Instructor Options
   - "Seed" resets the dataset.
   - "Build" regenerates schema/data (advanced/instructor use).
   - "Instructor" mode may reveal additional tools or solutions.

----------------------------------------------------------------------

Technical Notes
----------------------------------------------------------------------

- Uses sql.js to execute SQLite in WebAssembly.
- Some PostgreSQL-only features may not work due to SQLite engine.
- Fully static site; suitable for GitHub Pages (ensure correct relative
  paths to avoid CORS issues).
- Custom databases can be used by placing a new .db file next to the
  HTML and updating the load path.

----------------------------------------------------------------------

Pedagogical Use
----------------------------------------------------------------------

- Suitable for courses in accounting information systems, financial
  analysis, MIS, and data analytics.
- Helps students practice joins, aggregations, subqueries, CTEs, and
  relational reasoning.
- Encourages self-paced learning: write SQL, run it, inspect results,
  and iterate.
- Works on phones/tablets, increasing accessibility.

----------------------------------------------------------------------

Contributing or Adapting
----------------------------------------------------------------------

- Fork the repository to add new exercises or modify the schema.
- Replace the .db file with your own dataset.
- Add new UI features using the lightweight HTML/JS/CSS structure.
- Attribution to Hunter Ng is appreciated when reusing or modifying the
  design.

----------------------------------------------------------------------

License
----------------------------------------------------------------------

Distributed under the MIT license
----------------------------------------------------------------------

Contact
----------------------------------------------------------------------

For questions or suggestions, contact Hunter Ng via GitHub.
