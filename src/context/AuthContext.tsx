import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: localStorage.getItem('jwtToken'),
        isAuthenticated: false,
        isLoading: true,
    });

    // Configure axios defaults
    useEffect(() => {
        if (authState.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [authState.token]);

    const logout = () => {
        localStorage.removeItem('jwtToken');
        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const getCurrentUser = async () => {
        try {
            const response = await axios.get<UserResponse>(`${API_CONFIG.baseURL}/auth/me`);
            const { email, firstName, lastName, role } = response.data;
            
            setAuthState(prev => ({
                ...prev,
                user: { email, firstName, lastName, role },
                isAuthenticated: true,
                isLoading: false,
            }));
        } catch (error: any) {
            console.error('Get current user error:', error);
            // Only logout if it's actually an auth error, not other errors
            if (error.response?.status === 401 || error.response?.status === 403) {
                logout();
            }
            throw error;
        }
    };

    // Check authentication status on app load
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('jwtToken');
            
            if (token) {
                try {
                    setAuthState(prev => ({ ...prev, token }));
                    await getCurrentUser();
                } catch (error) {
                    console.error('Error initializing auth:', error);
                    logout();
                }
            } else {
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post<LoginResponse>(`${API_CONFIG.baseURL}/auth/login`, {
                email,
                password,
            });

            const { token, email: userEmail, firstName, lastName, role } = response.data;
            
            localStorage.setItem('jwtToken', token);
            
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
            await axios.post(`${API_CONFIG.baseURL}/auth/register`, {
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

    const value: AuthContextType = {
        authState,
        login,
        register,
        logout,
        getCurrentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 