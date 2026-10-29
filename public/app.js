const searchBar = document.getElementById("search-input-js");
const cancelSearchBtn = document.getElementById("cancel-search-btn-js");
const addBookBtns = document.querySelectorAll(".add-book-btn-js");
const editBookBtn = document.getElementById("edit-book-btn-js");
const removeBookBtn = document.getElementById("remove-book-btn-js");
const deleteFormInput = document.querySelector("input[name='deleteId']");
const genreChipsContainer = document.getElementById("genre-chips-container-js");
const genreManagerBtn = document.getElementById("genre-manager-btn-js");
const genreForm = document.getElementById("genre-form-js");
const genreList = document.querySelector(".genre-list-js");
const bookShelf = document.getElementById("book-shelf-js");
const keepBookBtn = document.querySelector(".keep-book-btn-js");
const mainContainer = document.getElementsByTagName("main")[0];
const bookFormModal = document.getElementById("book-form-modal-js");
const bookForm = document.getElementById("book-form-js");
const formCoverDetail = document.querySelectorAll(".form-cover-detail-js");
const deleteForm = document.getElementById("delete-form");
const formGenresWrapper = document.getElementById("book-form-genres-js");
const bookDetailModal = document.getElementById("book-detail-modal-js");
const confirmDeleteModal = document.getElementById("confirm-delete-modal-js");
const closeModalBtns = document.querySelectorAll(".close-modal-btn-js");
const starBtns = document.querySelectorAll(".star-btn-js");
const page = document.getElementById("page-container-js");
const formInputs = document.querySelectorAll(".form-input-js");
const isbnInput = document.getElementById("isbn-input-js");
const editFieldBtns = document.querySelectorAll(".edit-field-btn-js");
const sortBtns = document.querySelectorAll(".sort-btn-js");
const bookShelfViewBtns = document.querySelectorAll(".book-shelf-view-js");
const dialogs = document.querySelectorAll("dialog");

const debouncedSearch = debounce((event) => {
  handleSearchInput(event);
}, 350);
searchBar?.addEventListener("input", (event) => {
  cancelSearchBtn.classList.toggle("show", event.target.value.length > 0);
  const isAll = document.querySelector(".genre-js.active").name === "all";
  document
    .getElementById("hero-book-container-js")
    ?.classList.toggle("show", event.target.value.length === 0 && isAll);
  debouncedSearch(event);
});
cancelSearchBtn?.addEventListener("click", () => {
  searchBar.value = "";
  cancelSearchBtn.classList.remove("show");
  const isAll = document.querySelector(".genre-js.active").name === "all";
  document
    .getElementById("hero-book-container-js")
    ?.classList.toggle("show", isAll);
  handleSearchInput({ target: searchBar });
});
bookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const book = Object.fromEntries(data);
  const action = bookForm.action;
  book["genreIds"] = data.getAll("genreIds[]");
  delete book["genreIds[]"];
  const result = await updateBooks(book, action);
  if (result.errorMsg) {
    showToast(
      "error",
      result.errorMsg,
      "Please check the input fields and try again.",
    );
    return;
  }
  closeModal("book-form-modal-js");
  if (bookDetailModal.hasAttribute("open")) bookDetailModal.close();
  if (action.includes("/add")) {
    showToast(
      "success",
      "Book shelved",
      `${result.title} added to your library.`,
    );
  } else {
    showToast("success", "Changes saved", `${result.title} has been updated.`);
  }
  await uiRenderer(true);
});
formCoverDetail.forEach((coverDetail) => {
  coverDetail.addEventListener("input", (event) => {
    document.getElementById(`form-cover-${event.target.name}-js`).textContent =
      event.target.value;
  });
});
addBookBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    handleBookForm();
    bookFormModal.showModal();
  });
});
editBookBtn.addEventListener("click", async () => {
  const id = editBookBtn.dataset.bookId;
  const currentBook = await fetchBook(id);
  editFieldBtns.forEach((btn) => {
    btn.style.removeProperty("display");
  });
  handleBookForm(currentBook, "edit");
  bookFormModal.showModal();
});
removeBookBtn.addEventListener("click", () => {
  const id = removeBookBtn.dataset.bookId;
  deleteFormInput.value = id;
  document.querySelector(".delete-book-js").textContent =
    removeBookBtn.dataset.bookTitle;
  closeModal("book-detail-modal-js");
  confirmDeleteModal.showModal();
});
deleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const id = Object.fromEntries(data).deleteId;
  const result = await deleteBook(id);
  await uiRenderer(true);
  confirmDeleteModal.close();
  bookDetailModal.close();
  showToast(
    "info",
    "Book removed",
    `${result.title} was removed from your library.`,
  );
});
keepBookBtn.addEventListener("click", () => {
  closeModal("confirm-delete-modal-js");
  bookDetailModal.showModal();
});
genreChipsContainer.addEventListener("click", async (event) => {
  const genre = event.target.closest(".genre-js");
  if (!genre) return;
  const genreBtns = document.querySelectorAll(".genre-js");
  genreBtns.forEach((genreBtn) => genreBtn.classList.remove("active"));
  genre.classList.add("active");
  document
    .getElementById("hero-book-container-js")
    ?.classList.toggle("show", genre.name === "all" && !searchBar.value.trim());
  await uiRenderer(genre.name === "all", genre.name);
});
genreManagerBtn.addEventListener("click", () => {
  const genreManagerModal = document.getElementById("genre-manager-modal-js");
  const addGenreError = document.querySelector(".genre-error-js");
  genreForm.elements["genre"].value = "";
  addGenreError.classList.remove("show");
  genreManagerModal.showModal();
});
genreForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const genre = event.target.elements["genre"].value;
  const addGenreError = document.querySelector(".genre-error-js");
  const result = await addGenre(genre);
  if (!result) {
    addGenreError.classList.add("show");
  } else {
    genreForm.elements["genre"].value = "";
    addGenreError.classList.remove("show");
    showToast("success", "Genre created", `${result.name} is ready to use.`);
    const genreItemHTML = `<div class="genre-item-js genre-item"><span>${result.name}</span><button data-genre-id="${result.id}" data-genre-name="${result.name}" type="button" class="delete-genre-js">Remove</button></div>`;
    const genrechipHTML = `<button name="${result.name}" class="genre-js genre">${result.name}<span class="genre-count-js genre-count">${result.book_count}</span></button>`;
    const genreSelectHTML = `<button data-genre-id="${result.id}" name="${result.name}" type="button" class="selected-genre-js">${result.name}</button>`;
    genreList.insertAdjacentHTML("beforeend", genreItemHTML);
    genreManagerBtn.insertAdjacentHTML("beforebegin", genrechipHTML);
    formGenresWrapper.insertAdjacentHTML("beforeend", genreSelectHTML);
  }
});
genreList.addEventListener("click", async (event) => {
  const btn = event.target.closest(".delete-genre-js");
  if (!btn) return;
  const parent = btn.closest(".genre-item-js");
  const genreId = btn.dataset.genreId;
  if (!parseInt(genreId, 10)) return;
  const { name, book_count } = await deleteGenre(genreId);
  parent.remove();
  showToast(
    "info",
    "Genre removed",
    book_count
      ? `${name} was removed from ${book_count} ${book_count === 1 ? "book" : "books"}.`
      : `${name} was removed.`,
  );
  genreChipsContainer.querySelector(`button[name="${name}"]`).remove();
  formGenresWrapper.querySelector(`button[name="${name}"]`).remove();
  uiRenderer();
});
bookShelf.addEventListener("click", async (event) => {
  if (event.target.closest(".add-book-btn-js")) {
    handleBookForm();
    bookFormModal.showModal();
    return;
  }
  const book = event.target.closest(".book-js");
  if (!book) return;
  await viewDetails(book.dataset.bookId);
});
mainContainer.addEventListener("click", async (event) => {
  const heroBookDetsBtn = event.target.closest(".hero-view-dets-btn-js");
  if (!heroBookDetsBtn) return;
  await viewDetails(heroBookDetsBtn.dataset.bookId);
});
dialogs.forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
closeModalBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = btn.closest("dialog");
    closeModal(`${modal.id}`);
  });
});
starBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = bookForm.elements["rating"];
    input.removeAttribute("disabled");
    const oldRating = bookForm.elements["old_rating"].value;
    rateBook(btn.dataset.rating);
    const newRating = input.value;
    if (bookForm.action.includes("/edit") && oldRating === newRating) {
      input.setAttribute("disabled", "true");
    }
  });

  btn.addEventListener("mouseenter", () => {
    const rating = btn.dataset.rating;
    handleStarHover(rating);
  });

  btn.addEventListener("mouseleave", () => {
    const rating = bookForm.elements["rating"].value;
    rateBook(rating || 0);
  });
});
formGenresWrapper.addEventListener("click", (event) => {
  const btn = event.target.closest(".selected-genre-js");
  if (!btn) return;
  const selected = btn.classList.toggle("active");
  if (selected) {
    createInputElement(btn.dataset.genreId);
  } else {
    document
      .querySelector(`input[data-genre-id="${btn.dataset.genreId}"]`)
      .remove();
  }
});
page.addEventListener(
  "error",
  (event) => {
    if (event.target.tagName === "IMG") {
      handleImgError(event);
    }
  },
  true,
);
isbnInput.addEventListener("change", () => {
  bookForm.querySelector(".form-cover-placeholder").classList.remove("show");
  const img = bookForm.querySelector("img");
  img.style.display = "inline";
  img.src = `https://covers.openlibrary.org/b/isbn/${isbnInput.value}-L.jpg?default=false`;
});
editFieldBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = bookForm.elements[btn.dataset.inputId];
    btn.style.display = "none";
    input.disabled = false;
    input.focus();
  });
});
sortBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    sortBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    await uiRenderer(false, null, btn.id);
  });
});
bookShelfViewBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    bookShelf.style.transition = "none";
    document
      .querySelectorAll(".book")
      ?.forEach((item) => (item.style.transition = "none"));

    bookShelfViewBtns.forEach((b) => b.classList.remove("active"));
    bookShelf.classList.remove("grid-view", "list-view");
    const viewType = btn.name;
    const isEmpty = bookShelf.classList.contains("empty");
    bookShelf.classList.toggle(viewType, !isEmpty);
    btn.classList.add("active");

    void bookShelf.offsetHeight;

    bookShelf.style.transition = "";
    document
      .querySelectorAll(".book")
      .forEach((item) => (item.style.transition = ""));
  });
});

async function fetchBook(id) {
  try {
    const response = await fetch(`/book/${id}`, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    const book = await response.json();
    return book;
  } catch (error) {
    console.error("Error: ", error);
    return null;
  }
}

function populateBookDetailModal(book) {
  const bookCover = document.getElementById("book-cover-js");
  const bookCoverError = document.querySelector(".detail-img-error-icon");
  const bookGenres = document.getElementById("book-detail-genre-wrapper-js");
  const bookTitle = document.getElementById("book-detail-title-js");
  const bookAuthor = document.getElementById("book-detail-author-js");
  const bookRating = document.getElementById("book-rating-js");
  const bookReadDate = document.getElementById("book-detail-date-js");
  const bookPages = document.getElementById("book-detail-pages-js");
  const detailReviewContainer = document.getElementById(
    "detail-review-container-js",
  );
  const bookReview = document.getElementById("book-detail-review-js");
  let bookGenresHTML = "";
  let bookRatingHTML = "";

  bookCoverError.style.display = "none";
  bookCover.style.display = "inline";
  bookCover.src = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`;
  bookTitle.textContent = book.title;
  bookAuthor.textContent = book.author;
  bookReadDate.textContent = `Read ${formatDate(book.read_date)}`;
  bookPages.textContent = `${book.pages} pages`;
  detailReviewContainer.classList.toggle("show", book.review);
  bookReview.textContent = `"${book.review}"`;
  editBookBtn.dataset.bookId = book.id;
  removeBookBtn.dataset.bookId = book.id;
  removeBookBtn.dataset.bookTitle = book.title;

  for (let i = 0; i < book.genres.length; i++) {
    bookGenresHTML += `<span>${book.genres[i].name}</span>`;
  }

  for (let i = 0; i < 5; i++) {
    bookRatingHTML += `<span class="star ${i < book.rating ? "filled" : "empty"}">★</span>`;
  }

  bookGenres.innerHTML = bookGenresHTML;
  bookRating.innerHTML = bookRatingHTML;
}

async function viewDetails(bookId) {
  const currentBook = await fetchBook(bookId);
  if (!currentBook) return;
  populateBookDetailModal(currentBook);
  bookDetailModal.showModal();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.close();
}

function createInputElement(genreId) {
  const inputElement = document.createElement("input");
  inputElement.name = "genreIds[]";
  inputElement.type = "hidden";
  inputElement.value = genreId;
  inputElement.dataset.genreId = genreId;
  formGenresWrapper.append(inputElement);
}

function handleBookForm(book = {}, mode = "add") {
  const bookFormTitle = document.getElementById("book-form-title-js");
  const bookFormImg = bookForm.querySelector("img");
  const coverTitle = document.getElementById("form-cover-title-js");
  const coverAuthor = document.getElementById("form-cover-author-js");
  const bookFormGenres = document.querySelectorAll(".selected-genre-js");
  const genreInputs = document.querySelectorAll("input[name='genreIds[]']");
  const ratingDescription = bookForm.querySelector(".rating-description-js");
  if (genreInputs.length !== 0) {
    genreInputs.forEach((input) => {
      input.remove();
    });
  }
  bookFormGenres.forEach((genre) => {
    genre.classList.remove("active");
  });
  if (mode === "add") {
    bookForm.classList.remove("edit");
    bookForm.action = "/add";
    bookFormTitle.textContent = "Add a Book";
    bookForm.reset();
    formInputs.forEach((input) => {
      input.removeAttribute("disabled");
    });
    bookFormImg.src = "";
    bookFormImg.style.display = "none";
    coverTitle.textContent = "Book Title";
    coverAuthor.textContent = "Book Author";
    bookForm.elements["read_date"].value = new Date().toLocaleDateString(
      "en-CA",
    );
    rateBook();
    ratingDescription.textContent = "What did you think?";
    document.querySelector(".save-book-btn-js").innerHTML =
      "Add to library <span>→</span>";
  }

  if (mode === "edit") {
    bookForm.classList.add("edit");
    const title = bookForm.elements["title"];
    const author = bookForm.elements["author"];
    const pages = bookForm.elements["pages"];
    const oldPages = bookForm.elements["old_pages"];
    const isbn = bookForm.elements["isbn"];
    const date = bookForm.elements["read_date"];
    const oldDate = bookForm.elements["old_read_date"];
    const rating = bookForm.elements["rating"];
    const oldRating = bookForm.elements["old_rating"];
    const review = bookForm.elements["review"];

    bookFormImg.style.display = "inline";
    bookForm.querySelector(".form-cover-placeholder").classList.remove("show");
    bookFormImg.src = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`;
    coverTitle.textContent = book.title;
    coverAuthor.textContent = book.author;
    bookFormGenres.forEach((formGenre) => {
      const found = book.genres.find((genre) => formGenre.name === genre.name);
      if (found) {
        formGenre.classList.add("active");
        createInputElement(formGenre.dataset.genreId);
      }
    });

    bookForm.action = `/edit/${book.id}`;
    bookFormTitle.textContent = "Edit Book";
    title.value = book.title;
    title.setAttribute("disabled", "true");
    author.value = book.author;
    author.setAttribute("disabled", "true");
    pages.value = book.pages;
    pages.setAttribute("disabled", "true");
    oldPages.value = book.pages;
    isbn.value = book.isbn || "";
    isbn.setAttribute("disabled", "true");
    rateBook(book.rating);
    ratingDescription.textContent = book.rating
      ? `${book.rating} out of 5`
      : "What did you think?";
    rating.setAttribute("disabled", "true");
    oldRating.value = book.rating;
    review.value = book.review;
    const readDate = new Date(book.read_date);

    const year = readDate.getFullYear();
    const month = String(readDate.getMonth() + 1).padStart(2, "0");
    const day = String(readDate.getDate()).padStart(2, "0");

    date.value = `${year}-${month}-${day}`;
    date.setAttribute("disabled", "true");
    oldDate.value = book.read_date;

    document.querySelector(".save-book-btn-js").innerHTML =
      "Save changes <span>→</span>";
  }
}

function rateBook(bookRating = 0) {
  bookForm.elements["rating"].value = bookRating;
  starBtns.forEach((btn) => {
    const star = btn.querySelector("span");
    star.className = "";
    btn.dataset.rating <= bookRating
      ? star.classList.add("filled")
      : star.classList.add("empty");
  });
  bookForm.querySelector(".rating-description-js").textContent =
    bookRating != 0 ? `${bookRating} out of 5` : "What did you think?";
}

function handleStarHover(hoveredRating) {
  starBtns.forEach((btn) => {
    const star = btn.querySelector("span");
    star.className = "";
    btn.dataset.rating <= hoveredRating
      ? star.classList.add("filled")
      : star.classList.add("empty");
  });
}

function formatDate(date) {
  const dateObj = new Date(date);
  const readableDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(dateObj);
  return readableDate;
}

function handleImgError(event) {
  const img = event.target;
  const parent = img.parentElement;
  img.style.display = "none";

  if (img.id !== "book-form-img-js") {
    parent.querySelector(".img-error-js").style.display = "flex";

    if (parent.classList.contains("thumbnail")) {
      parent.querySelector(".thumbnail-spine").style.display = "block";
    }
  } else {
    parent.querySelector(".form-cover-placeholder").classList.add("show");
  }
}

async function fetchBooks(genre = "all", order = "recency", search = "") {
  try {
    const params = new URLSearchParams({ genre, order, search });
    const response = await fetch(`/library?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: ", error);
    return null;
  }
}

async function updateBooks(book, action) {
  try {
    const response = await fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: ", error);
    return error;
  }
}

async function addGenre(genre) {
  try {
    const response = await fetch("/add-genre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre: genre }),
    });

    if (!response.ok) {
      const errorMsg = await response.json();
      throw new Error(errorMsg.error || `Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding genre:", error.message);
    return null;
  }
}

async function deleteBook(bookId) {
  try {
    const response = await fetch(`/delete/${bookId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: ", error);
    return error;
  }
}

async function deleteGenre(genreId) {
  try {
    const response = await fetch(`/delete-genre/${genreId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

function generateBooks(books) {
  if (!bookShelf) return;

  // Clear existing books
  bookShelf.innerHTML = "";

  if (books.length === 0) {
    bookShelf.innerHTML = `
      <div class="empty-book-icon">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M8 8.5C14.5 7.5 20 9 24 13v27c-4-4-9.5-5.5-16-4.5v-27Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M40 8.5C33.5 7.5 28 9 24 13v27c4-4 9.5-5.5 16-4.5v-27Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M13 15c3.5 0 6 .8 8 2.4M35 15c-3.5 0-6 .8-8 2.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".55"
          />
        </svg>
      </div>
      <h3>No books here yet</h3>
      <p>${!searchBar.value.trim() ? "Start adding books to your library" : `No results for "${searchBar.value}"`}</p>
      ${!searchBar.value.trim() ? `<button class="add-book-btn-js">Add your first book</button>` : ""}
    `;
    return;
  }

  // Generate new books
  books.forEach((book) => {
    const bookBtn = document.createElement("button");
    bookBtn.className = "book-js book";
    bookBtn.dataset.bookId = book.id;

    let starRatingHtml = "";
    let listGenresHtml = "";

    for (let i = 0; i < 5; i++) {
      starRatingHtml += `<span class="star ${i < book.rating ? "filled" : "empty"}">★</span>`;
    }

    for (let i = 0; i < 2; i++) {
      if (!book.genres[i]) break;
      listGenresHtml += `<span class="genre-tag-l">${book.genres[i].name}</span>`;
    }
    if (book.genres.length > 2) {
      listGenresHtml += `<span class="genre-tag-l">+${book.genres.length - 2}</span>`;
    }

    bookBtn.innerHTML = `
      <div class="thumbnail list-only">
        <img id="list-view-image-js" src="https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false" alt="${book.title}" />
        <div class="img-error-js thumbnail-img-error">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path
              d="M8 8.5C14.5 7.5 20 9 24 13v27c-4-4-9.5-5.5-16-4.5v-27Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M40 8.5C33.5 7.5 28 9 24 13v27c4-4 9.5-5.5 16-4.5v-27Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M13 15c3.5 0 6 .8 8 2.4M35 15c-3.5 0-6 .8-8 2.4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </div>
        <div class="thumbnail-spine"></div>
      </div>
      <div class="book-cover-wrapper grid-only">
        <div class="book-cover-3d">
          <img id="grid-view-image-js" src="https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false" alt="${book.title}" />
          <div class="img-error-js cover-img-error">
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="M8 8.5C14.5 7.5 20 9 24 13v27c-4-4-9.5-5.5-16-4.5v-27Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M40 8.5C33.5 7.5 28 9 24 13v27c4-4 9.5-5.5 16-4.5v-27Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M13 15c3.5 0 6 .8 8 2.4M35 15c-3.5 0-6 .8-8 2.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
            <span class="cover-title">${book.title}</span>
          </div>
          <div class="gloss-overlay"></div>
          <div class="rating-badge-container">
            <div class="rating-badge">
              ${starRatingHtml}
            </div>
          </div>
        </div>
        ${book.genres[0] ? `<div class="genre-tag"><span>${book.genres[0].name} ${book.genres.length > 1 ? "+" + (book.genres.length - 1) : ""}</span></div>` : ""}
      </div>
      <div class="book-info grid-only">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <div data-book-rating="${book.rating}" class="star-rating">
          ${starRatingHtml}
        </div>
      </div>
      <div class="book-info-l list-only">
        <p class="book-title-l">${book.title}</p>
        <p class="book-author-l">${book.author}</p>
        <p class="book-review-l">${book.review}</p>
      </div>
      <div class="genre-tags-container list-only">
        ${listGenresHtml}
      </div>
      <div class="star-rating-l list-only">
        ${starRatingHtml}
      </div>
      <span class="book-date list-only">${formatDate(book.read_date)}</span>`;
    bookShelf.appendChild(bookBtn);
  });
}

async function handleSearchInput(event) {
  const query = event.target.value.trim();
  if (query.length > 0 && query.length < 3) return;

  await uiRenderer();
}

function debounce(func, delay) {
  let timerId;

  return function (...args) {
    // Clear previous timer on keypress
    clearTimeout(timerId);

    // Set new timer
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function updateHeroBook(book) {
  if (document.querySelector(".genre-js.active" !== "all")) return;

  if (!book) {
    document.getElementById("hero-book-container-js").remove();
    return;
  }

  const heroBookImg = document.getElementById("hero-book-image-js");
  const heroBookImgError = document.getElementById("hero-book-img-error-js");
  const heroBookTitle = document.getElementById("hero-book-title-js");
  const heroBookAuthor = document.getElementById("hero-book-author-js");
  const heroBookReview = document.getElementById("hero-book-review-js");
  const heroStarRating = document.getElementById("hero-star-rating-js");
  const heroViewDetsBtn = document.querySelector(".hero-view-dets-btn-js");

  let heroStarRatingHtml = "";
  let heroBookReviewHtml = `<p id="hero-book-review-js" class="hero-book-review">"${book.review}"</p>`;

  for (let i = 0; i < 5; i++) {
    heroStarRatingHtml += `<span class="star ${i < book.rating ? "filled" : "empty"}">★</span>`;
  }
  heroBookImgError.style.display = "none"
  heroBookImg.style.display = "inline";
  heroBookImg.src = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`;
  heroBookTitle.textContent = book.title;
  heroBookAuthor.textContent = `${book.author} · ${formatDate(book.read_date)}`;
  heroStarRating.innerHTML = heroStarRatingHtml;
  heroViewDetsBtn.dataset.bookId = book.id;

  if (book.review && heroBookReview) {
    heroBookReview.textContent = `"${book.review}"`;
  } else if (!book.review && heroBookReview) {
    heroBookReview.remove();
  } else if (book.review && !heroBookReview) {
    heroViewDetsBtn.insertAdjacentHTML("beforebegin", heroBookReviewHtml);
  }
}

function updateStats(stats) {
  const bookCountStat = document.querySelector(".book-count-stat-js");
  const avgRatingStat = document.querySelector(".avg-rating-stat-js");
  const pagesTurnedStat = document.querySelector(".pages-turned-stat-js");
  const thisYearStat = document.querySelector(".this-year-stat-js");
  bookCountStat.textContent = stats.bookCount;
  avgRatingStat.innerHTML = `${stats.approxAvgRating}<span class="filled">★</span>`;
  pagesTurnedStat.textContent = stats.pagesTurned;
  thisYearStat.textContent = stats.thisYear;
}

function updateGenres(genres) {
  const genreBtns = document.querySelectorAll(".genre-js");
  const data = {};
  genres.forEach((genre) => {
    data[`${genre.name}`] = genre.book_count;
  });
  genreBtns.forEach((btn) => {
    if (btn.name !== "all") {
      btn.querySelector(".genre-count-js").textContent = data[`${btn.name}`];
    }
  });
}

async function uiRenderer(update = false, genre = null, order = null) {
  const collectionDetails = document.querySelector(".collection-details-js");
  const activeGenre =
    genre || document.querySelector(".genre-js.active")?.name || "all";
  const activeSortOrder =
    order || document.querySelector(".sort-btn-js.active")?.name || "recency";
  const query = searchBar?.value.trim() || "";

  const response = await fetchBooks(activeGenre, activeSortOrder, query);
  const { books, genres, metadata } = response;

  bookShelf.classList.toggle("empty", books.length === 0);
  const currentView =
    document.querySelector(".book-shelf-view-js.active")?.name || "grid-view";
  bookShelf.classList.toggle(currentView, books.length > 0);

  const quantifier = books.length !== 1 ? "books" : "book";

  if (
    !document.getElementById("hero-book-container-js") &&
    activeGenre === "all"
  ) {
    let starRatingHtml = "";

    for (let i = 0; i < 5; i++) {
      starRatingHtml += `<span class="star ${i < books[0].rating ? "filled" : "empty"}">★</span>`;
    }
    const heroBookHtml = `
      <div id="hero-book-container-js" class="hero-book-container show">
        <div class="hero-glow">
          <div class="hero-orb-1"></div>
          <div class="hero-orb-2"></div>
        </div>
        <div class="hero-book">
          <div class="hero-book-cover">
            <img id="hero-book-image-js" src="https://covers.openlibrary.org/b/isbn/${books[0].isbn}-L.jpg?default=false" alt="${books[0].title}" />
            <div id="hero-book-img-error-js" class="img-error-js hero-book-img-error">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path
                  d="M8 8.5C14.5 7.5 20 9 24 13v27c-4-4-9.5-5.5-16-4.5v-27Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M40 8.5C33.5 7.5 28 9 24 13v27c4-4 9.5-5.5 16-4.5v-27Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 15c3.5 0 6 .8 8 2.4M35 15c-3.5 0-6 .8-8 2.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
            </div>
          </div>
          <div class="hero-book-details">
            <span class="hero-book-label">Recently Read</span>
            <h2 id="hero-book-title-js" class="hero-book-title">${books[0].title}</h2>
            <p id="hero-book-author-js" class="hero-book-author">${books[0].author} · ${formatDate(books[0].read_date)}</p>
            <div id="hero-star-rating-js" class="hero-star-rating">
              ${starRatingHtml}
            </div>
            ${books[0].review ? `<p id="hero-book-review-js" class="hero-book-review">"${books[0].review}"</p>` : ""}
            <button data-book-id="${books[0].id}" class="hero-view-dets-btn-js hero-view-dets-btn">
              View Details <span>→</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document
      .getElementById("controls-container-js")
      .insertAdjacentHTML("beforebegin", heroBookHtml);
  }

  if (activeGenre !== "all" && !query) {
    collectionDetails.innerHTML = `${books.length} ${quantifier} in <span>${activeGenre}</span>`;
  } else if (activeGenre !== "all" && query) {
    collectionDetails.innerHTML = `${books.length} ${quantifier} in <span>${activeGenre}</span> matching "${query}"`;
  } else if (activeGenre === "all" && query) {
    collectionDetails.innerHTML = `${books.length} ${quantifier} matching "${query}"`;
  } else {
    collectionDetails.innerHTML = `${books.length} ${quantifier}`;
  }

  if (update) updateStats(metadata);
  if (update) updateGenres(genres);
  if (update && !query) updateHeroBook(books[0]);
  generateBooks(books);
}

function showToast(tone, title, message) {
  const activeDialog = document.querySelector("dialog[open]");

  const toastRegion = activeDialog
    ? activeDialog.querySelector(".toast-region-js")
    : document.getElementById("toast-region-js");
  if (!toastRegion) return;

  const toastItems = document.querySelectorAll(".toast-item-js");
  const toastId = `toast-number-${toastItems.length + 1}`;
  const symbols = { success: "✓", error: "!", info: "i" };
  const symbol = symbols[tone];

  const toastHTML = `
    <div id="${toastId}" class="toast-item-js toast-item ${tone}">
      <span>${symbol}</span>
      <div class="toast-details">
        <p class="toast-title">${title}</p>
        <p class="toast-message">${message}</p>
      </div>
      <button type="button" class="dismiss-toast-btn-js dismiss-toast-btn">✕</button>
    </div> 
  `;

  toastRegion.insertAdjacentHTML("afterbegin", toastHTML);
  const toast = toastRegion.querySelector(`#${toastId}`);

  toast.timeoutId = setTimeout(() => {
    toast.remove();
  }, 4200);

  toast.addEventListener("mouseenter", () => {
    clearTimeout(toast.timeoutId);
  });

  toast.addEventListener("mouseleave", () => {
    toast.timeoutId = setTimeout(() => {
      toast.remove();
    }, 4200);
  });

  const closeBtn = toast.querySelector(".dismiss-toast-btn-js");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearTimeout(toast.timeoutId);
      toast.remove();
    });
  }
}
