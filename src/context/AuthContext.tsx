import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../lib/apiConfig';

interface User {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextType {
    authState: AuthState;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    logout: () => void;
    getCurrentUser: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

interface LoginResponse {
    token: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface UserResponse {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely access localStorage
const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem('jwtToken');
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
    }
};

const setStoredToken = (token: string): void => {
    try {
        localStorage.setItem('jwtToken', token);
    } catch (error) {
        console.error('Error setting localStorage:', error);
    }
};

const removeStoredToken = (): void => {
    try {
        localStorage.removeItem('jwtToken');
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
};

// Helper function to check if token is potentially expired
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Assume expired if we can't parse it
    }
};

// Helper function to clear potentially invalid tokens during development
const clearInvalidToken = (): void => {
    const token = getStoredToken();
    if (token && isTokenExpired(token)) {
        console.log('Clearing expired token from localStorage');
        removeStoredToken();
    }
};

// Create a separate axios instance for authentication verification
// This avoids the interceptors in apiService that might interfere
const authAxios = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // Clear any expired tokens first
    clearInvalidToken();
    
    // Check if there's a token in localStorage during initialization
    const initialToken = getStoredToken();
    console.log('AuthProvider initializing with token:', initialToken ? `TOKEN_EXISTS (${initialToken.substring(0, 20)}...)` : 'NO_TOKEN');
    
    // If we have a token, check if it's expired
    if (initialToken && isTokenExpired(initialToken)) {
        console.log('Token is expired, clearing it');
        removeStoredToken();
    }
    
    const validInitialToken = getStoredToken(); // Get token again after potential cleanup
    
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: validInitialToken,
        isAuthenticated: !!validInitialToken, // Trust the token initially only if it's not expired
        isLoading: !!validInitialToken, // Only show loading if we have a token to verify
    });

    console.log('AuthProvider initial state:', { 
        hasToken: !!authState.token, 
        isAuthenticated: authState.isAuthenticated, 
        isLoading: authState.isLoading 
    });

    // Note: Authentication headers are handled by ApiService interceptor for other requests
    // But we use our own axios instance for auth verification to avoid conflicts

    const logout = () => {
        console.log('Logging out user');
        removeStoredToken();
        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const getCurrentUser = useCallback(async () => {
        const token = getStoredToken();
        console.log('getCurrentUser called with token:', token ? 'TOKEN_EXISTS' : 'NO_TOKEN');
        
        if (!token) {
            console.log('No token found, logging out');
            logout();
            return;
        }

        try {
            console.log('Making request to /auth/me');
            // Use our dedicated auth axios instance instead of apiService
            const response = await authAxios.get<UserResponse>('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const { email, firstName, lastName, role } = response.data;
            
            console.log('User verification successful:', { email, role });
            setAuthState(prev => ({
                ...prev,
                user: { email, firstName, lastName, role },
                token,
                isAuthenticated: true,
                isLoading: false,
            }));
        } catch (error: any) {
            console.error('Get current user error:', error.response?.status, error.message);
            // Token is invalid or expired, clear authentication
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('Token invalid, logging out');
                logout();
            } else {
                // For other errors, just set loading to false but keep authentication
                console.log('Network error, keeping auth state but stopping loading');
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
            throw error;
        }
    }, []);

    // Check authentication status on app load
    useEffect(() => {
        console.log('AuthProvider useEffect running');
        const initializeAuth = async () => {
            const token = getStoredToken();
            console.log('Initializing auth with token:', token ? `TOKEN_EXISTS (${token.substring(0, 20)}...)` : 'NO_TOKEN');
            
            if (token) {
                try {
                    console.log('Verifying token with server');
                    // Use our dedicated auth axios instance instead of apiService
                    const response = await authAxios.get<UserResponse>('/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const { email, firstName, lastName, role } = response.data;
                    
                    console.log('Token verification successful, setting user data');
                    setAuthState(prev => ({
                        ...prev,
                        user: { email, firstName, lastName, role },
                        isLoading: false,
                    }));
                } catch (error: any) {
                    console.error('Error initializing auth:', error.response?.status, error.message);
                    console.error('Full error details:', error.response?.data);
                    
                    // Handle different types of auth errors
                    if (error.response?.status === 401) {
                        console.log('Token is invalid or expired (401), logging out');
                        logout();
                    } else if (error.response?.status === 403) {
                        console.log('Token is valid but access is forbidden (403) - this might indicate a backend issue');
                        // For 403, we might want to keep the user logged in but show an error
                        // Or we can log them out if 403 indicates invalid token in this context
                        console.log('Treating 403 as invalid token, logging out');
                        logout();
                    } else {
                        console.log('Network or other error, keeping auth state but stopping loading');
                        setAuthState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            } else {
                // No token, ensure state reflects unauthenticated status
                console.log('No token found, setting unauthenticated state');
                setAuthState({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            }
        };

        // Only run once on mount
        initializeAuth();
    }, []); // Remove getCurrentUser from dependencies to avoid infinite loop

    const login = async (email: string, password: string) => {
        try {
            // Use regular axios for login to avoid interceptor conflicts
            const response = await authAxios.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            const { token, email: userEmail, firstName, lastName, role } = response.data;
            
            setStoredToken(token);
            
            setAuthState({
                user: { email: userEmail, firstName, lastName, role },
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            // Use regular axios for register to avoid interceptor conflicts
            await authAxios.post('/auth/register', {
                email,
                password,
                firstName,
                lastName,
            });
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const refreshAuth = async () => {
        console.log('Refreshing authentication...');
        try {
            await getCurrentUser();
        } catch (error) {
            console.error('Failed to refresh authentication:', error);
            logout();
            throw error;
        }
    };

    const value: AuthContextType = {
        authState,
        login,
        register,
        logout,
        getCurrentUser,
        refreshAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 