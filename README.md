# Stacks — Book Notes

**A personal book tracking web application**

**Tech stack:** Node.js, Express, EJS, PostgreSQL

## Screenshot

![Stacks grid view](./docs/screenshot.png)

## Features

- Add, view, edit, and remove books.
- Save ISBN, title, author, page count, date read, a one-to-five-star rating,
  review, and one or more genres.
- Search by title or author, filter by genre, and sort by recent date, rating,
  or title.
- Switch between grid and list views.
- See collection statistics, including books read, average rating, pages read,
  and books read this year.
- Add and remove genres.
- View book-cover images from Open Library when a cover is available.

## Requirements

- Node.js 18 or later and npm
- PostgreSQL 14 or later
- Internet connection (only needed to load book covers)

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a PostgreSQL database:

   ```sh
   createdb booknotes
   ```

3. Copy the example environment file and set the database password and any
   other connection details:

   ```sh
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` instead.

   `DATABASE_URL` should be a PostgreSQL connection URL, for example:
   `postgresql://postgres:your_password@localhost:5432/booknotes`.
   `PORT` is optional and defaults to `3000`.

4. Create the database tables from the schema:

   ```sh
   psql "postgresql://postgres:your_password@localhost:5432/booknotes" -f schema.sql
   ```

   Replace `your_password` with your PostgreSQL password.  Use the same connection URL you put in `DATABASE_URL`.

5. Start the application:

   ```sh
   npm start
   ```

   For development with automatic restarts when files change, use:

   ```sh
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000), or use the port configured by `PORT`.

## Notes

- The schema is not managed by a migration tool. Create the database and
  tables before starting the server.
- Covers are requested from Open Library using each book's ISBN. A missing
  cover, or no internet connection, does not prevent using the library.
- Never commit your `.env` file. It is listed in `.gitignore`. Only
  `.env.example` is committed.

## Troubleshooting

- **Database connection refused:** Make sure PostgreSQL is running, the
  database exists, and `DATABASE_URL` in `.env` has the correct host, port,
  username, password, and database name.
- **Missing tables:** Run the schema command from the setup steps against the
  same database specified in `DATABASE_URL`.
- **Port already in use:** Set a different port in `.env`, for example
  `PORT=3001`, then restart the application.

## Project structure

```text
.
├── README.md
├── package.json
├── .env.example      # Example environment variables
├── .gitignore        # Includes .env
├── index.js          # Express server, routes, and PostgreSQL queries
├── schema.sql        # PostgreSQL table definitions
├── docs/
│   └── screenshot.png
├── public/
│   ├── app.js        # Browser interactions
│   └── style.css     # Application styles
└── views/
    └── index.ejs     # EJS page template
```

## License

This project is licensed under the ISC License, as declared in `package.json`.
