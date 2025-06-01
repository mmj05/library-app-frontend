import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SpinnerLoading } from '../layouts/Utils/SpinnerLoading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    path: string;
    exact?: boolean;
    adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    path, 
    exact = false, 
    adminOnly = false 
}) => {
    const { authState } = useAuth();

    if (authState.isLoading) {
        return <SpinnerLoading />;
    }

    if (!authState.isAuthenticated) {
        return <Redirect to="/login" />;
    }

    if (adminOnly && authState.user?.role !== 'ADMIN') {
        return <Redirect to="/home" />;
    }

    return (
        <Route path={path} exact={exact}>
            {children}
        </Route>
    );
};

export default ProtectedRoute; 