import './App.css';
import { Navbar } from './layouts/NavbarAndFooter/Navbar';
import { Footer } from './layouts/NavbarAndFooter/Footer';
import { HomePage } from './layouts/HomePage/HomePage';
import { SearchBooksPage } from './layouts/SearhBooksPage/SearchBooksPage';
import { Redirect, Route, Switch } from 'react-router-dom';
import { BookCheckoutPage } from './layouts/BookCheckoutPage/BookCheckoutPage';
import { ReviewListPage } from './layouts/BookCheckoutPage/ReviewListPage/ReviewListPage';
import { ShelfPage } from './layouts/ShelfPage/ShelfPage';
import { MessagesPage } from './layouts/MessagesPage/MessagesPage';
import { ManageLibraryPage } from './layouts/ManageLibraryPage/ManageLibraryPage';
import { PaymentPage } from './layouts/PaymentPage/PaymentPage';
import { AuthProvider } from './context/AuthContext';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';
import ProtectedRoute from './components/ProtectedRoute';

export const App = () => {
    return (
        <AuthProvider>
            <div className='d-flex flex-column min-vh-100'>
                <Navbar />
                <div className='flex-grow-1'>
                    <Switch>
                        <Route path='/' exact>
                            <Redirect to='/home' />
                        </Route>
                        <Route path='/home'>
                            <HomePage />
                        </Route>
                        <Route path='/search'>
                            <SearchBooksPage />
                        </Route>
                        <Route path='/reviewlist/:bookId'>
                            <ReviewListPage />
                        </Route>
                        <Route path='/checkout/:bookId'>
                            <BookCheckoutPage />
                        </Route>
                        <Route path='/login'>
                            <LoginForm />
                        </Route>
                        <Route path='/register'>
                            <RegisterForm />
                        </Route>
                        <ProtectedRoute path='/shelf'>
                            <ShelfPage />
                        </ProtectedRoute>
                        <ProtectedRoute path='/messages'>
                            <MessagesPage />
                        </ProtectedRoute>
                        <ProtectedRoute path='/admin' adminOnly={true}>
                            <ManageLibraryPage />
                        </ProtectedRoute>
                        <ProtectedRoute path='/fees'>
                            <PaymentPage />
                        </ProtectedRoute>
                    </Switch>
                </div>
                <Footer />
            </div>
        </AuthProvider>
    );
};
