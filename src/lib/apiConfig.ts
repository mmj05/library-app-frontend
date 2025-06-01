export const API_CONFIG = {
    baseURL: process.env.REACT_APP_API || 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
}; 