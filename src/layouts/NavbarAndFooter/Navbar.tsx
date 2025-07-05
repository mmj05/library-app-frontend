import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SpinnerLoading } from '../Utils/SpinnerLoading';

export const Navbar = () => {
    const { authState, logout } = useAuth();

    if (authState.isLoading) {
        return <SpinnerLoading />;
    }

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className='navbar navbar-expand-lg navbar-dark main-color py-3'>
            <div className='container-fluid'>
                <span className='navbar-brand'>Read with Love</span>
                <button
                    className='navbar-toggler'
                    type='button'
                    data-bs-toggle='collapse'
                    data-bs-target='#navbarNavDropdown'
                    aria-controls='navbarNavDropdown'
                    aria-expanded='false'
                    aria-label='Toggle Navigation'
                >
                    <span className='navbar-toggler-icon'></span>
                </button>
                <div
                    className='collapse navbar-collapse'
                    id='navbarNavDropdown'
                >
                    <ul className='navbar-nav'>
                        <li className='nav-item'>
                            <NavLink className='nav-link' to='/home'>
                                {' '}
                                Home
                            </NavLink>
                        </li>
                        <li className='nav-item'>
                            <NavLink className='nav-link' to='/search'>
                                {' '}
                                Search Books
                            </NavLink>
                        </li>
                        {authState.isAuthenticated && (
                            <li className='nav-item'>
                                <NavLink className='nav-link' to='/shelf'>
                                    Shelf
                                </NavLink>
                            </li>
                        )}
                        {authState.isAuthenticated && (
                            <li className='nav-item'>
                                <NavLink className='nav-link' to='/fees'>
                                    Pay fees
                                </NavLink>
                            </li>
                        )}
                        {authState.isAuthenticated &&
                            authState.user?.role === 'ADMIN' && (
                                <li className='nav-item'>
                                    <NavLink className='nav-link' to='/admin'>
                                        Admin
                                    </NavLink>
                                </li>
                            )}
                    </ul>
                    <ul className='navbar-nav ms-auto'>
                        {!authState.isAuthenticated ? (
                            <>
                                <li className='nav-item m-1'>
                                    <Link
                                        type='button'
                                        className='btn btn-outline-light'
                                        to='/login'
                                    >
                                        Sign in
                                    </Link>
                                </li>
                                <li className='nav-item m-1'>
                                    <Link
                                        type='button'
                                        className='btn btn-outline-light'
                                        to='/register'
                                    >
                                        Sign up
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <li className='nav-item dropdown'>
                                <button
                                    className='nav-link dropdown-toggle btn btn-link'
                                    type='button'
                                    id='navbarDropdown'
                                    data-bs-toggle='dropdown'
                                    aria-expanded='false'
                                    style={{ border: 'none', color: 'inherit', textDecoration: 'none' }}
                                >
                                    {authState.user?.firstName} {authState.user?.lastName}
                                </button>
                                <ul className='dropdown-menu'>
                                    <li>
                                        <button
                                            className='dropdown-item'
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};
