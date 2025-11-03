import "./index.css";
import { useState, useEffect, useMemo } from "react";

import AppHeader from "./components/AppHeader";
import Main from "./components/Main";
import Footer from "./components/Footer";
import BookModal from "./components/BookModal";

function App() {
  // Page state: books or loans
  const [view, setView] = useState("books");

  // ✅ Loans saved from localStorage
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem("loans");
    return saved ? JSON.parse(saved) : [];
  });

  // Books stored in localStorage
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem("books");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingBook, setEditingBook] = useState(null);
  const [selectedPublisher, setSelectedPublisher] = useState("All");

  // ✅ Save books to localStorage
  useEffect(() => {
    localStorage.setItem("books", JSON.stringify(books));
  }, [books]);

  // ✅ Save loans to localStorage
  useEffect(() => {
    localStorage.setItem("loans", JSON.stringify(loans));
  }, [loans]);

  // Unique publishers for filter
  const publishers = useMemo(() => {
    const uniquePublishers = [...new Set(books.map(b => b.publisher?.trim()).filter(Boolean))];
    return ["All", ...uniquePublishers];
  }, [books]);

  // Filtered books
  const filteredBooks =
    selectedPublisher === "All"
      ? books
      : books.filter(book => book.publisher === selectedPublisher);

  // Available books (not loaned)
  const availableBooks = books.filter((book) => {
    const index = books.indexOf(book);
    return !loans.some(l => l.bookIndex === index);
  });

  /* ------------------ BOOK ACTIONS ------------------ */

  const handleAddBook = (newBook) => {
    setBooks(prev => [...prev, { ...newBook, selected: false }]);
  };

  const handleSelectBook = (index) => {
    setBooks(prev =>
      prev.map((book, i) => ({
        ...book,
        selected: i === index ? !book.selected : false
      }))
    );
  };

  // Block deletion if book is on loan
  const handleDeleteBook = () => {
    const selectedIndex = books.findIndex(book => book.selected);

    if (loans.some(l => l.bookIndex === selectedIndex)) {
      alert("This book is currently on loan and cannot be deleted.");
      return;
    }

    setBooks(prev => prev.filter(book => !book.selected));
  };

  const handleEditClick = () => {
    const index = books.findIndex(book => book.selected);
    if (index !== -1) {
      setEditingBook({ ...books[index], index });
    }
  };

  const handleUpdateBook = (updatedBook) => {
    if (editingBook !== null) {
      setBooks(prev =>
        prev.map((book, i) =>
          i === editingBook.index ? { ...updatedBook, selected: false } : book
        )
      );
      setEditingBook(null);
    }
  };

  /* ------------------ LOAN ACTIONS ------------------ */

  const handleAddLoan = (loan) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loan.weeks * 7);

    setLoans(prev => [...prev, { ...loan, dueDate }]);
  };

  return (
    <div className="app">
      <section id="root">
        <AppHeader />

        <Main className="content">

          {/* ------------------ BOOK PAGE ------------------ */}
          {view === "books" && (
            <>
              <div className="actions">
                <button className="btn primary" onClick={() => setView("loans")}>
                  Manage Loans
                </button>

                <BookModal
                  onAddBook={handleAddBook}
                  editingBook={editingBook}
                  onUpdateBook={handleUpdateBook}
                  onCancelEdit={() => setEditingBook(null)}
                />

                <button
                  className="btn secondary"
                  onClick={handleEditClick}
                  disabled={!books.some(b => b.selected)}
                >
                  Edit
                </button>

                <button
                  className="btn danger"
                  onClick={handleDeleteBook}
                  disabled={
                    !books.some(b => b.selected) || 
                    loans.some(l => l.bookIndex === books.findIndex(book => book.selected))
                  }
                >
                  Delete
                </button>

                {/* Publisher Filter */}
                <div className="filter-section">
                  <h3>Filter by Publisher</h3>
                  <select
                    value={selectedPublisher}
                    onChange={(e) => setSelectedPublisher(e.target.value)}
                    className="publisher-filter"
                  >
                    {publishers.map((publisher, index) => (
                      <option key={index} value={publisher}>
                        {publisher}
                      </option>
                    ))}
                  </select>

                  {selectedPublisher !== "All" && (
                    <button
                      className="btn clear-filter"
                      onClick={() => setSelectedPublisher("All")}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Books Grid */}
              <div className="book_group">
                {filteredBooks.length === 0 ? (
                  <p className="no-books">
                    {books.length === 0 ? "" : "No books found for this publisher"}
                  </p>
                ) : (
                  filteredBooks.map((book) => {
                    const index = books.indexOf(book);
                    const isLoaned = loans.some(l => l.bookIndex === index);

                    return (
                      <div
                        key={index}
                        className={`book-card ${book.selected ? "selected" : ""}`}
                        onClick={() => handleSelectBook(index)}
                      >
                        {book.image ? (
                          <img src={book.image} alt={book.title} className="book-image" />
                        ) : (
                          <div className="book-image placeholder">📘</div>
                        )}

                        <p><strong>{book.title}</strong></p>
                        <p>by {book.author}</p>
                        {book.publisher && <p className="book-publisher">{book.publisher}</p>}

                        {isLoaned && <p className="on-loan-tag">📕 On Loan</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ------------------ LOAN PAGE ------------------ */}
          {view === "loans" && (
            <div className="loan-page">

              <button className="btn secondary" onClick={() => setView("books")}>
                ← Back to Library
              </button>

              <h1>Manage Loans</h1>

              {availableBooks.length > 0 ? (
                <div className="loan-form-box">
                  <h3>Borrow a Book</h3>

                  <form
                    className="loan-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const borrower = e.target.borrower.value;
                      const bookIndex = parseInt(e.target.book.value);
                      const weeks = parseInt(e.target.weeks.value);
                      handleAddLoan({ borrower, bookIndex, weeks });
                      e.target.reset();
                    }}
                  >
                    <label>Borrower</label>
                    <input name="borrower" type="text" placeholder="Enter your name" required />

                    <label>Book</label>
                    <select name="book">
                      {availableBooks.map((book, idx) => {
                        const index = books.indexOf(book);
                        return (
                          <option key={idx} value={index}>
                            {book.title}
                          </option>
                        );
                      })}
                    </select>

                    <label>Loan Period (weeks)</label>
                    <input name="weeks" type="number" min="1" max="4" defaultValue="1" required />

                    <button className="btn primary" type="submit">Submit</button>
                  </form>
                </div>
              ) : (
                <p className="no-books-msg"><strong>Nothing can be loaned.</strong></p>
              )}

              <h2>Currently On Loan</h2>

              {loans.length === 0 ? (
                <p>No books are currently loaned.</p>
              ) : (
                <div className="loan-card-list">
                  {loans.map((loan, i) => (
                    <div className="loan-card" key={i}>
                      <p>Borrower: <strong>{loan.borrower}</strong></p>
                      <p>Book: {books[loan.bookIndex]?.title}</p>
                      <p>Loan Period: {loan.weeks} week(s)</p>
                      <p>Due Date: {new Date(loan.dueDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </Main>

        <Footer />
      </section>
    </div>
  );
}

export default App;
