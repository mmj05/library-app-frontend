import { useEffect, useState } from 'react';
import BookModel from '../../models/BookModel';
import { SpinnerLoading } from '../Utils/SpinnerLoading';
import { SearchBook } from './components/SearchBook';
import { Pagination } from '../Utils/Pagination';
import { apiService } from '../../lib/apiService';

export const SearchBooksPage = () => {
    const [books, setBooks] = useState<BookModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [httpError, setHttpError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [booksPerPage] = useState(5);
    const [totalAmountOfBooks, setTotalAmountOfBooks] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [searchUrl, setSearchUrl] = useState('');
    const [categorySelection, setCategorySelection] = useState('Book category');

    useEffect(() => {
        const fetchBooks = async () => {
            let responseJson;

            if (searchUrl === '') {
                responseJson = await apiService.getBooks(currentPage - 1, booksPerPage);
            } else if (searchUrl.includes('/search/findByTitleContainingIgnoreCase')) {
                responseJson = await apiService.searchBooks(search, currentPage - 1, booksPerPage);
            } else if (searchUrl.includes('/search/findByCategory')) {
                const categoryMatch = searchUrl.match(/category=([^&]+)/);
                const category = categoryMatch ? categoryMatch[1] : '';
                responseJson = await apiService.searchBooksByCategory(category, currentPage - 1, booksPerPage);
            } else {
                responseJson = await apiService.getBooks(currentPage - 1, booksPerPage);
            }

            const responseData = responseJson._embedded.books;

            setTotalAmountOfBooks(responseJson.page.totalElements);
            setTotalPages(responseJson.page.totalPages);

            const loadedBooks: BookModel[] = [];

            for (const key in responseData) {
                loadedBooks.push({
                    id: responseData[key].id,
                    title: responseData[key].title,
                    author: responseData[key].author,
                    description: responseData[key].description,
                    copies: responseData[key].copies,
                    copiesAvailable: responseData[key].copiesAvailable,
                    category: responseData[key].category,
                    img: responseData[key].img,
                });
            }

            setBooks(loadedBooks);
            setIsLoading(false);
        };
        fetchBooks().catch((error: any) => {
            setIsLoading(false);
            setHttpError(error.message);
        });
        window.scrollTo(0, 0);
    }, [currentPage, searchUrl, booksPerPage, search]);

    if (isLoading) {
        return <SpinnerLoading />;
    }

    if (httpError) {
        return (
            <div className='container m-5'>
                <p>{httpError}</p>
            </div>
        );
    }

    const searchHandleChange = () => {
        setCurrentPage(1);
        if (search === '') {
            setSearchUrl('');
        } else {
            setSearchUrl(
                `/search/findByTitleContainingIgnoreCase?title=${search}&page=<pageNumber>&size=${booksPerPage}`
            );
        }
        setCategorySelection('Book category')
    };

    const categoryField = (value: string) => {
        setCurrentPage(1);
        if (
            value.toLowerCase() === 'front-end' ||
            value.toLowerCase() === 'back-end' ||
            value.toLowerCase() === 'data' ||
            value.toLowerCase() === 'devops'
        ) {
            setCategorySelection(value);
            setSearchUrl(`/search/findByCategory?category=${value}&page=<pageNumber>&size=${booksPerPage}`);
        } else {
            setCategorySelection('All');
            setSearchUrl(`?page=<pageNumber>&size=${booksPerPage}`);
        }
    }

    const indexOfLastBook: number = currentPage * booksPerPage;
    const indexOfFirstBook: number = indexOfLastBook - booksPerPage;
    let lastItem =
        booksPerPage * currentPage <= totalAmountOfBooks
            ? booksPerPage * currentPage
            : totalAmountOfBooks;

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div>
            <div className='container'>
                <div>
                    <div className='row mt-5'>
                        <div className='col-6'>
                            <div className='d-flex'>
                                <input
                                    className='form-control me-2'
                                    type='search'
                                    placeholder='Search'
                                    aria-labelledby='Search'
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button
                                    className='btn btn-outline-success'
                                    onClick={() => searchHandleChange()}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                        <div className='col-4'>
                            <div className='dropdown'>
                                <button
                                    className='btn btn-secondary dropdown-toggle'
                                    type='button'
                                    id='dropdownMenuButton1'
                                    data-bs-toggle='dropdown'
                                    aria-expanded='false'
                                >
                                    {categorySelection}
                                </button>
                                <ul
                                    className='dropdown-menu'
                                    aria-labelledby='dropdownMenuButton1'
                                >
                                    <li onClick={() => categoryField('All')}>
                                        <button
                                            type='button'
                                            className='dropdown-item'
                                        >
                                            All
                                        </button>
                                    </li>
                                    <li onClick={() => categoryField('Front-End')}>
                                        <button
                                            type='button'
                                            className='dropdown-item'
                                        >
                                            Front-End
                                        </button>
                                    </li>
                                    <li onClick={() => categoryField('Back-End')}>
                                        <button
                                            type='button'
                                            className='dropdown-item'
                                        >
                                            Back-End
                                        </button>
                                    </li>
                                    <li onClick={() => categoryField('Data')}>
                                        <button
                                            type='button'
                                            className='dropdown-item'
                                        >
                                            Data
                                        </button>
                                    </li>
                                    <li onClick={() => categoryField('DevOps')}>
                                        <button
                                            type='button'
                                            className='dropdown-item'
                                        >
                                            DevOps
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    {totalAmountOfBooks > 0 ? (
                        <>
                            <div className='mt-3'>
                                <h5>
                                    Number of results: ({totalAmountOfBooks})
                                </h5>
                            </div>
                            <p>
                                {indexOfFirstBook + 1} to {lastItem} of{' '}
                                {totalAmountOfBooks} items:
                            </p>
                            {books.map((book) => (
                                <SearchBook book={book} key={book.id} />
                            ))}
                        </>
                    ) : (
                        <div className='m-5'>
                            <h3>Can't find what you are looking for?</h3>
                            <button
                                type='button'
                                className='btn main-color btn-md px-4 me-md-2 fw-bold text-white'
                            >
                                Library Services
                            </button>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            paginate={paginate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
