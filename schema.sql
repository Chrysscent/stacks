CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  isbn VARCHAR(20),
  rating INTEGER,
  review TEXT,
  read_date DATE,
  pages INTEGER
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  book_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS book_genre (
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);

-- 1. Create a function that recalculates totals directly from what's currently in the table
CREATE OR REPLACE FUNCTION sync_all_genre_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset counts to 0 for genres that currently have no books
    UPDATE genres SET book_count = 0;

    -- Recalculate totals directly from the junction table state
    UPDATE genres g
    SET book_count = subquery.cnt
    FROM (
        SELECT genre_id, COUNT(*) as cnt 
        FROM book_genre 
        GROUP BY genre_id
    ) subquery
    WHERE g.id = subquery.genre_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind it to run ONCE per SQL statement (after INSERT, UPDATE, or DELETE finishes)
CREATE TRIGGER trg_book_genre_statement_sync
AFTER INSERT OR UPDATE OR DELETE ON book_genre
FOR EACH STATEMENT
EXECUTE FUNCTION sync_all_genre_counts();
