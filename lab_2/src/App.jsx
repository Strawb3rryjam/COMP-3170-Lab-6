import "./index.css";
import { useState, useEffect, useMemo } from "react";

import AppHeader from './components/AppHeader';
import Main from './components/Main';
import Footer from './components/Footer';
import BookModal from './components/BookModal';

function App() {
  // Load books from localStorage
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem("books");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingBook, setEditingBook] = useState(null);
  const [selectedPublisher, setSelectedPublisher] = useState("All");

  // Save to localStorage whenever books change
  useEffect(() => {
    localStorage.setItem("books", JSON.stringify(books));
  }, [books]);

  // generate publishers (updates immediately)
  const publishers = useMemo(() => {
    const uniquePublishers = [...new Set(books.map(b => b.publisher?.trim()).filter(Boolean))];
    return ["All", ...uniquePublishers];
  }, [books]);

  // Filter books
  const filteredBooks =
    selectedPublisher === "All"
      ? books
      : books.filter(book => book.publisher === selectedPublisher);

  // Add new book
  const handleAddBook = (newBook) => {
    setBooks(prev => [...prev, { ...newBook, selected: false }]);
  };

  // Select one book
  const handleSelectBook = (index) => {
    setBooks(prev =>
      prev.map((book, i) => ({
        ...book,
        selected: i === index ? !book.selected : false,
      }))
    );
  };

  // Delete selected
  const handleDeleteBook = () => {
    setBooks(prev => prev.filter(book => !book.selected));
  };

  // Edit selected
  const handleEditClick = () => {
    const selectedIndex = books.findIndex(book => book.selected);
    if (selectedIndex !== -1) {
      setEditingBook({ ...books[selectedIndex], index: selectedIndex });
    }
  };

  // Update book
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

  return (
    <div className="app">
      <section id="root">
        <AppHeader />
        <Main className="content">
          <div className="actions">
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
              disabled={!books.some(b => b.selected)}
            >
              Delete
            </button>

            {/* 🔍 Filter Section */}
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

          <div className="book_group">
            {filteredBooks.length === 0 ? (
              <p className="no-books">
                {books.length === 0 ? "" : "No books found for this publisher"}
              </p>
            ) : (
              filteredBooks.map((book, index) => {
                const originalIndex = books.indexOf(book);
                return (
                  <div
                    key={originalIndex}
                    className={`book-card ${book.selected ? "selected" : ""}`}
                    onClick={() => handleSelectBook(originalIndex)}
                  >
                    {book.image ? (
                      <img
                        src={book.image}
                        alt={book.title}
                        className="book-image"
                      />
                    ) : (
                      <div className="book-image placeholder">📘</div>
                    )}

                    <p><strong>{book.title}</strong></p>
                    <p>by {book.author}</p>
                    {book.publisher && (
                      <p className="book-publisher">{book.publisher}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Main>
        <Footer />
      </section>
    </div>
  );
}

export default App;
