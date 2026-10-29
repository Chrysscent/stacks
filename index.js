import "dotenv/config";
import bodyParser from "body-parser";
import ejs from "ejs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in your .env file.");
}

const isProduction = !!process.env.VERCEL;

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 3,
});

app.engine("ejs", ejs.renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

const metadata = {
  bookCount: 0,
  approxAvgRating: 0,
  exactAvgRating: 0,
  pagesTurned: 0,
  thisYear: 0,
};

app.get("/", async (req, res) => {
  const { books, genres } = await getBooks();
  getMetadata(books);
  res.render("index.ejs", { books, genres, metadata });
});

app.get("/library", async (req, res) => {
  const { genre, order, search } = req.query;
  const { books, genres } = await getBooks(genre, order, search);
  res.json({ books, genres, metadata });
});

app.get("/book/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  const book = await getBook(bookId);
  res.json(book);
});

app.post("/add", async (req, res) => {
  const genreIds = req.body["genreIds"].map((id) => parseInt(id, 10));
  const { rating, pages, read_date } = req.body;
  const data = {
    rating: parseInt(rating, 10),
    pages: parseInt(pages, 10),
    read_date,
  };
  (delete req.body.genreIds,
    delete req.body.old_rating,
    delete req.body.old_pages,
    delete req.body.old_read_date);
  const query1 =
    "INSERT INTO books (isbn, title, author, pages, read_date, rating, review) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
  const query2 =
    "INSERT INTO book_genre (book_id, genre_id) SELECT $1, unnested_genre_id FROM unnest($2::int[]) AS unnested_genre_id;";
  try {
    await db.query("BEGIN");
    const result = await db.query(query1, Object.values(req.body));
    const newBookId = result.rows[0].id;
    await db.query(query2, [newBookId, genreIds]);
    await db.query("COMMIT");
    updateMetadata("add", data);
    console.log("Success");
    res.json(result.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Transaction failed: ", error);
    res.json({ errorMsg: "Failed to add book" });
  }
});

app.post("/edit/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  const genreIds = req.body["genreIds"].map((id) => parseInt(id, 10));
  const { rating, pages, read_date, old_rating, old_pages, old_read_date } =
    req.body;
  const data = {
    rating: parseInt(rating, 10),
    pages: parseInt(pages, 10),
    read_date,
    old_rating: parseInt(old_rating, 10),
    old_pages: parseInt(old_pages, 10),
    old_read_date,
  };
  (delete req.body.genreIds,
    delete req.body.old_rating,
    delete req.body.old_pages,
    delete req.body.old_read_date);
  const columns = [];
  const values = [];
  let placeholderIndex = 1;

  Object.keys(req.body).forEach((key) => {
    columns.push(`"${key}" = $${placeholderIndex}`);
    values.push(req.body[key]);
    placeholderIndex++;
  });

  values.push(bookId);

  const query1 = `UPDATE books SET ${columns.join(", ")} WHERE id = $${placeholderIndex} RETURNING *`;
  const query2 = "DELETE FROM book_genre WHERE book_id = $1;";
  const query3 =
    "INSERT INTO book_genre (book_id, genre_id) SELECT $1, unnested_genre_id FROM unnest($2::int[]) AS unnested_genre_id ON CONFLICT (book_id, genre_id) DO NOTHING;";
  try {
    await db.query("BEGIN");
    const result = await db.query(query1, values);
    await db.query(query2, [bookId]);
    await db.query(query3, [bookId, genreIds]);
    await db.query("COMMIT");
    updateMetadata("edit", data);
    console.log("Success");
    res.json(result.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Transaction failed: ", error);
    res.json({ errorMsg: "Failed to save changes" });
  }
});

app.post("/add-genre", async (req, res) => {
  let genre = req.body.genre.trim().toLowerCase();

  try {
    const result = await db.query(
      "INSERT INTO genres (name) VALUES ($1) RETURNING *",
      [genre],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Genre already exists." });
    }

    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = await db.query("DELETE FROM books WHERE id = $1 RETURNING *", [
    id,
  ]);
  if (result) {
    const { rating, pages, read_date } = result.rows[0];
    const data = {
      rating: parseInt(rating, 10),
      pages: parseInt(pages, 10),
      read_date,
    };
    updateMetadata("delete", data);
  }
  res.json(result.rows[0]);
});

app.delete("/delete-genre/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = await db.query(
    "DELETE FROM genres WHERE id = $1 RETURNING *",
    [id],
  );
  res.json(result.rows[0]);
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Draining database pool connection cache...`);
  try {
    await db.end();
    console.log("Database connections closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("Error closing database connections during shutdown:", err);
    process.exit(1);
  }
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function getBooks(genre = "all", order = "recency", search = "") {
  const sortOptions = {
    recency: "read_date DESC",
    rating: "rating DESC",
    title: "title",
  };
  const sortOrder = sortOptions[order] || "read_date";
  const searchPattern = `%${search}%`;
  const query = ` 
      SELECT 
          b.id, b.title, b.author, b.isbn, b.rating, b.review, b.read_date, b.pages,
          COALESCE(
              jsonb_agg(
                  jsonb_build_object('id', g.id, 'name', g.name)
              ) FILTER (WHERE g.id IS NOT NULL), 
              '[]'::jsonb
          ) AS genres
      FROM books b
      LEFT JOIN book_genre bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE 
          (($1 = 'all') OR (b.id IN (SELECT book_id 
              FROM book_genre sub_bg
              JOIN genres sub_g ON sub_bg.genre_id = sub_g.id
              WHERE $1 = sub_g.name
          )))
          AND (b.title ILIKE $2 OR b.author ILIKE $2)
      GROUP BY b.id
      ORDER BY ${sortOrder}, b.id ASC;
    `;
  const result = await db.query(query, [genre, searchPattern]);
  const books = result.rows;
  books.forEach((book) => {
    book["getFormattedDate"] = formatDate;
  });
  const genres = await getGenres();
  return { books, genres };
}

async function getBook(id) {
  const query = `
      SELECT 
          b.id, b.title, b.author, b.isbn, b.rating, b.review, b.read_date, b.pages,
          COALESCE(
              jsonb_agg(
                  jsonb_build_object('id', g.id, 'name', g.name)
              ) FILTER (WHERE g.id IS NOT NULL), 
              '[]'::jsonb
          ) AS genres
      FROM books b
      LEFT JOIN book_genre bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE b.id = $1
      GROUP BY b.id;
    `;
  const result = await db.query(query, [parseInt(id, 10)]);
  const book = result.rows[0];
  return book;
}

async function getGenres() {
  const result = await db.query("SELECT * FROM genres ORDER BY id;");
  return result.rows;
}

function formatDate() {
  if (!this.read_date) return "No date provided";

  const dateObj = new Date(this.read_date);
  const readableDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(dateObj);
  return readableDate;
}

function getMetadata(books) {
  if (!books || books.length === 0)
    return { bookCount: 0, avgRating: 0, pagesTurned: 0, thisYear: 0 };

  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`\\b${currentYear}\\b`);

  const totals = books.reduce(
    (acc, book) => {
      if (!acc.seenBooks.has(book.id)) {
        acc.bookCount++;
        acc.ratings += book.rating;
        acc.pages += book.pages;
        if (pattern.test(`${book.read_date}`)) acc.thisYear++;
        acc.seenBooks.add(book.id);
      }
      return acc;
    },
    { bookCount: 0, ratings: 0, pages: 0, thisYear: 0, seenBooks: new Set() },
  );

  metadata.bookCount = totals.bookCount;
  metadata.approxAvgRating = +(totals.ratings / totals.bookCount).toFixed(1);
  metadata.exactAvgRating = totals.ratings / totals.bookCount;
  metadata.pagesTurned = totals.pages;
  metadata.thisYear = totals.thisYear;
}

function updateMetadata(action, data) {
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`\\b${currentYear}\\b`);
  if (action === "add") {
    updateMetadataAdd(data.rating, data.pages, data.read_date, pattern);
  } else if (action === "edit") {
    if (!data.rating) data.rating = data.old_rating;
    if (!data.pages && data.pages != 0) data.pages = data.old_pages;
    if (!data.read_date) data.read_date = data.old_read_date;
    updateMetadataDelete(
      data.old_rating,
      data.old_pages,
      data.old_read_date,
      pattern,
    );
    updateMetadataAdd(data.rating, data.pages, data.read_date, pattern);
  } else if (action === "delete") {
    updateMetadataDelete(data.rating, data.pages, data.read_date, pattern);
  }
}

function updateMetadataAdd(rating, pages, date, pattern) {
  if (rating || rating === 0) {
    metadata.exactAvgRating =
      (metadata.exactAvgRating * metadata.bookCount + rating) /
      ++metadata.bookCount;
    metadata.approxAvgRating = +metadata.exactAvgRating.toFixed(1);
  }
  metadata.pagesTurned += pages;
  if (pattern.test(`${date}`)) metadata.thisYear++;
}

function updateMetadataDelete(rating, pages, date, pattern) {
  if (metadata.bookCount <= 1) {
    metadata.bookCount = 0;
    metadata.exactAvgRating = 0;
    metadata.approxAvgRating = 0;
    metadata.pagesTurned = 0;
    metadata.thisYear = 0;
    return;
  }

  if (rating || rating === 0) {
    metadata.exactAvgRating =
      (metadata.exactAvgRating * metadata.bookCount - rating) /
      --metadata.bookCount;
    metadata.approxAvgRating = +metadata.exactAvgRating.toFixed(1);
  }
  metadata.pagesTurned -= pages;
  if (pattern.test(`${date}`)) metadata.thisYear--;
}
