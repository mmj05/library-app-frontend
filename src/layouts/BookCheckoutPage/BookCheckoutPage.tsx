import { useEffect, useState } from 'react';
import BookModel from '../../models/BookModel';
import { SpinnerLoading } from '../Utils/SpinnerLoading';
import { StarsReview } from '../Utils/StarsReview';
import { CheckoutAndReviewBox } from './CheckoutAndReviewBox';
import ReviewModel from '../../models/ReviewModel';
import { useAuth } from '../../context/AuthContext';
import { LatestReviews } from './LatestReviews';
import { useParams } from 'react-router-dom';
import ReviewRequestModel from '../../models/ReviewRequestModel';
import { apiService } from '../../lib/apiService';

export const BookCheckoutPage = () => {
    const { authState } = useAuth();

    const [book, setBook] = useState<BookModel>();
    const [isLoading, setIsLoading] = useState(true);
    const [httpError, setHttpError] = useState(null);

    // Review State
    const [reviews, setReviews] = useState<ReviewModel[]>([]);
    const [totalStars, setTotalStars] = useState(0);
    const [isLoadingReview, setIsLoadingReview] = useState(true);

    const [isReviewLeft, setIsReviewLeft] = useState(false);
    const [isLoadingUserReview, setIsLoadingUserReview] = useState(true);

    // Loans Count State
    const [currentLoansCount, setCurrentLoansCount] = useState(0);
    const [isLoadingCurrentLoansCount, setIsLoadingCurrentLoansCount] =
        useState(true);

    // Is Book Check Out?
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [isLoadingBookCheckedOut, setIsLoadingBookCheckedOut] =
        useState(true);

    // Payment
    const [displayError, setDisplayError] = useState(false);

    const { bookId } = useParams<{ bookId: string }>();

    useEffect(() => {
        const fetchBooks = async () => {
            const responseJson = await apiService.getBook(bookId!);

            const loadedBooks: BookModel = {
                id: responseJson.id,
                title: responseJson.title,
                author: responseJson.author,
                description: responseJson.description,
                copies: responseJson.copies,
                copiesAvailable: responseJson.copiesAvailable,
                category: responseJson.category,
                img: responseJson.img,
            };

            setBook(loadedBooks);
            setIsLoading(false);
        };

        fetchBooks().catch((error: any) => {
            setIsLoading(false);
            setHttpError(error.message);
        });
    }, [isCheckedOut, bookId]);

    useEffect(() => {
        const fetchBookReviews = async () => {
            const responsejsonReviews = await apiService.getBookReviews(bookId!);

            const responseData = responsejsonReviews._embedded.reviews;

            const loadedReviews: ReviewModel[] = [];

            let weightedStarReviews: number = 0;

            for (const key in responseData) {
                loadedReviews.push({
                    id: responseData[key].id,
                    userEmail: responseData[key].userEmail,
                    date: responseData[key].date,
                    rating: responseData[key].rating,
                    book_id: responseData[key].bookId,
                    reviewDescription: responseData[key].reviewDescription,
                });
                weightedStarReviews =
                    weightedStarReviews + responseData[key].rating;
            }

            if (loadedReviews) {
                const round = (
                    Math.round(
                        (weightedStarReviews / loadedReviews.length) * 2
                    ) / 2
                ).toFixed(1);
                setTotalStars(Number(round));
            }

            setReviews(loadedReviews);
            setIsLoadingReview(false);
        };

        fetchBookReviews().catch((error: any) => {
            setIsLoadingReview(false);
            setHttpError(error.message);
        });
    }, [isReviewLeft, bookId]);

    useEffect(() => {
        const fetchUserReviewBook = async () => {
            if (authState && authState.isAuthenticated && !authState.isLoading) {
                try {
                    const userReviewResponseJson = await apiService.getUserReviewForBook(bookId!);
                    setIsReviewLeft(userReviewResponseJson);
                } catch (error: any) {
                    // Only set error if it's not an auth error (auth errors are handled by interceptors)
                    if (error.response?.status !== 401 && error.response?.status !== 403) {
                        setHttpError(error.message);
                    }
                }
            }
            setIsLoadingUserReview(false);
        };

        // Only make the call if auth is not loading
        if (!authState.isLoading) {
            fetchUserReviewBook();
        }
    }, [authState, bookId]);

    useEffect(() => {
        const fetchUserCurrentLoansCount = async () => {
            if (authState && authState.isAuthenticated && !authState.isLoading) {
                try {
                    const currentLoansCountResponseJson = await apiService.getCurrentLoansCount();
                    setCurrentLoansCount(currentLoansCountResponseJson);
                } catch (error: any) {
                    // Only set error if it's not an auth error
                    if (error.response?.status !== 401 && error.response?.status !== 403) {
                        setHttpError(error.message);
                    }
                }
            }
            setIsLoadingCurrentLoansCount(false);
        };
        
        // Only make the call if auth is not loading
        if (!authState.isLoading) {
            fetchUserCurrentLoansCount();
        }
    }, [authState, isCheckedOut, bookId]);

    useEffect(() => {
        const fetchUserCheckedOutBook = async () => {
            if (authState && authState.isAuthenticated && !authState.isLoading) {
                try {
                    const bookCheckedOutResponseJson = await apiService.isBookCheckedOutByUser(bookId!);
                    setIsCheckedOut(bookCheckedOutResponseJson);
                } catch (error: any) {
                    // Only set error if it's not an auth error
                    if (error.response?.status !== 401 && error.response?.status !== 403) {
                        setHttpError(error.message);
                    }
                }
            }
            setIsLoadingBookCheckedOut(false);
        };
        
        // Only make the call if auth is not loading
        if (!authState.isLoading) {
            fetchUserCheckedOutBook();
        }
    }, [authState, bookId]);

    if (
        isLoading ||
        isLoadingReview ||
        isLoadingCurrentLoansCount ||
        isLoadingBookCheckedOut ||
        isLoadingUserReview
    ) {
        return <SpinnerLoading />;
    }

    if (httpError) {
        return (
            <div className='container m-5'>
                <p>{httpError}</p>
            </div>
        );
    }

    async function checkoutBook() {
        try {
            await apiService.checkoutBook(bookId!);
            setDisplayError(false);
            setIsCheckedOut(true);
        } catch (error: any) {
                            if (process.env.NODE_ENV === 'development') {
                    console.error('Checkout error:', error);
                }
            setDisplayError(true);
            
            // Handle specific error cases
            if (error.response?.status === 400) {
                const errorData = error.response.data;
                
                // Check if it's already a parsed object or a string
                let parsedError = errorData;
                if (typeof errorData === 'string') {
                    try {
                        parsedError = JSON.parse(errorData);
                    } catch (parseError) {
                        console.error('Error parsing error response:', parseError);
                        throw new Error('Something went wrong!');
                    }
                }
                
                // Handle outstanding fees error
                if (parsedError.error === 'Outstanding fees' || parsedError.error === 'Book unavailable') {
                    // The error message will be displayed by the displayError state
                    // Don't throw an error, just return to show the UI error message
                    return;
                }
            }
            
            // For other errors, still throw to maintain existing behavior
            throw new Error('Something went wrong!');
        }
    }

    async function submitReview(starInput: number, reviewDescription: string) {
        let bookId: number = 0;
        if (book?.id) {
            bookId = book.id;
        }

        if (!authState?.isAuthenticated) {
            alert('You must be logged in to submit a review. Please log in and try again.');
            return;
        }
        
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('Authentication token is missing. Please log out and log in again.');
            return;
        }

        const reviewRequestModel = new ReviewRequestModel(
            starInput,
            bookId,
            reviewDescription
        );
        
        try {
            await apiService.submitReview(reviewRequestModel);
            setIsReviewLeft(true);
        } catch (error: any) {
            console.error('Submit review error:', error);
            if (error.response?.status === 403) {
                alert('Authentication failed. Your session may have expired. You will be redirected to login.');
                window.location.href = '/login';
            } else if (error.response?.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = '/login';
            } else {
                alert('Failed to submit review. Please try again.');
            }
        }
    }

    return (
        <div>
            <div className='container d-none d-lg-block'>
                {displayError && (
                    <div className='alert alert-danger mt-3' role='alert'>
                        Please pay outstanding fees and/or return late book(s).
                    </div>
                )}
                <div className='row mt-5'>
                    <div className='col-sm-2 col-md-2'>
                        {book?.img ? (
                            <img
                                src={book?.img}
                                width='226'
                                height='349'
                                alt='Book'
                            />
                        ) : (
                            <img
                                src={require('./../../Images/BooksImages/book-luv2code-1000.png')}
                                width='226'
                                height='349'
                                alt='Book'
                            />
                        )}
                    </div>
                    <div className='col-4 col-md-4 container'>
                        <div className='ml-2'>
                            <h2>{book?.title}</h2>
                            <h5 className='text-primary'>{book?.author}</h5>
                            <p className='lead'>{book?.description}</p>
                            <StarsReview
                                rating={totalStars}
                                size={32}
                            />
                        </div>
                    </div>
                    <CheckoutAndReviewBox
                        book={book}
                        mobile={false}
                        currentLoansCount={currentLoansCount}
                        isAuthenticated={authState?.isAuthenticated}
                        isCheckedOut={isCheckedOut}
                        checkoutBook={checkoutBook}
                        isReviewLeft={isReviewLeft}
                        submitReview={submitReview}
                    />
                </div>
                <hr />
                <LatestReviews
                    reviews={reviews}
                    bookId={book?.id}
                    mobile={false}
                />
            </div>
            <div className='container d-lg-none mt-5'>
                {displayError && (
                    <div className='alert alert-danger mt-3' role='alert'>
                        Please pay outstanding fees and/or return late book(s).
                    </div>
                )}
                <div className='d-flex justify-content-center align-items-center'>
                    {book?.img ? (
                        <img
                            src={book?.img}
                            width='226'
                            height='349'
                            alt='Book'
                        />
                    ) : (
                        <img
                            src={require('./../../Images/BooksImages/book-luv2code-1000.png')}
                            width='226'
                            height='349'
                            alt='Book'
                        />
                    )}
                </div>
                <div className='mt-4'>
                    <div className='ml-2'>
                        <h2>{book?.title}</h2>
                        <h5 className='text-primary'>{book?.author}</h5>
                        <p className='lead'>{book?.description}</p>
                        <StarsReview
                            rating={totalStars}
                            size={32}
                        />
                    </div>
                </div>
                <CheckoutAndReviewBox
                    book={book}
                    mobile={true}
                    currentLoansCount={currentLoansCount}
                    isAuthenticated={authState?.isAuthenticated}
                    isCheckedOut={isCheckedOut}
                    checkoutBook={checkoutBook}
                    isReviewLeft={isReviewLeft}
                    submitReview={submitReview}
                />
                <hr />
                <LatestReviews
                    reviews={reviews}
                    bookId={book?.id}
                    mobile={true}
                />
            </div>
        </div>
    );
};
