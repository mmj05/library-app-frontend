import axios from 'axios';
import { API_CONFIG } from './apiConfig';

class ApiService {
    private axiosInstance: any;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.baseURL,
            timeout: API_CONFIG.timeout,
            headers: API_CONFIG.headers,
        });

        // Request interceptor to add token
        this.axiosInstance.interceptors.request.use(
            (config: any) => {
                const token = localStorage.getItem('jwtToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.debug('Added authorization header to request:', config.url);
                } else {
                    console.warn('No JWT token found in localStorage for secure request:', config.url);
                }
                return config;
            },
            (error: any) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle authentication errors
        this.axiosInstance.interceptors.response.use(
            (response: any) => {
                return response;
            },
            (error: any) => {
                console.error('API Error:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message
                });
                
                // Log authentication errors but don't automatically handle them
                // Let the AuthContext handle authentication state management
                if (error.response?.status === 401) {
                    console.warn('Authentication error detected - token may be expired or invalid');
                    // Don't automatically remove token or redirect here
                    // The AuthContext will handle this properly
                }
                
                return Promise.reject(error);
            }
        );
    }

    // Generic HTTP methods
    async get(url: string): Promise<any> {
        const response = await this.axiosInstance.get(url);
        return response.data;
    }

    async post(url: string, data?: any): Promise<any> {
        const response = await this.axiosInstance.post(url, data);
        return response.data;
    }

    async put(url: string, data?: any): Promise<any> {
        const response = await this.axiosInstance.put(url, data);
        return response.data;
    }

    async delete(url: string): Promise<any> {
        const response = await this.axiosInstance.delete(url);
        return response.data;
    }

    // Specific API methods
    async getUserReviewForBook(bookId: string): Promise<boolean> {
        return this.get(`/reviews/secure/user/book?bookId=${bookId}`);
    }

    async isBookCheckedOutByUser(bookId: string): Promise<boolean> {
        return this.get(`/books/secure/ischeckedout/byuser?bookId=${bookId}`);
    }

    async getCurrentLoansCount(): Promise<number> {
        return this.get('/books/secure/currentloans/count');
    }

    async checkoutBook(bookId: string): Promise<void> {
        return this.put(`/books/secure/checkout?bookId=${bookId}`);
    }

    async submitReview(reviewData: any): Promise<void> {
        return this.post('/reviews/secure', reviewData);
    }

    async getBook(bookId: string): Promise<any> {
        return this.get(`/books/${bookId}`);
    }

    async getBookReviews(bookId: string): Promise<any> {
        return this.get(`/reviews/search/findByBookId?bookId=${bookId}`);
    }

    // Authentication endpoints
    async login(email: string, password: string) {
        return this.post('/auth/login', { email, password });
    }

    async register(email: string, password: string, firstName: string, lastName: string) {
        return this.post('/auth/register', { email, password, firstName, lastName });
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // Books endpoints
    async getBooks(page = 0, size = 20) {
        return this.get(`/books?page=${page}&size=${size}`);
    }

    async searchBooks(searchQuery: string, page = 0, size = 20) {
        return this.get(`/books/search/findByTitleContaining?title=${searchQuery}&page=${page}&size=${size}`);
    }

    async searchBooksByCategory(category: string, page = 0, size = 20) {
        return this.get(`/books/search/findByCategory?category=${category}&page=${page}&size=${size}`);
    }

    async returnBook(bookId: number) {
        return this.put(`/books/secure/return?bookId=${bookId}`);
    }

    async renewLoan(bookId: number) {
        return this.put(`/books/secure/renew/loan?bookId=${bookId}`);
    }

    async getCurrentLoans() {
        return this.get('/books/secure/currentloans');
    }

    // Reviews endpoints
    async getReviewsByBook(bookId: number, page = 0, size = 5) {
        return this.get(`/reviews/search/findByBookId?bookId=${bookId}&page=${page}&size=${size}`);
    }

    // Messages endpoints
    async getMessages(userEmail: string, page = 0, size = 5) {
        return this.get(`/messages/search/findByUserEmail?userEmail=${userEmail}&page=${page}&size=${size}`);
    }

    async postMessage(title: string, question: string) {
        return this.post('/messages/secure/add/message', {
            title,
            question,
        });
    }

    // Admin endpoints
    async addBook(bookData: any) {
        return this.post('/admin/secure/add/book', bookData);
    }

    async increaseBookQuantity(bookId: number) {
        return this.put(`/admin/secure/increase/book/quantity?bookId=${bookId}`);
    }

    async decreaseBookQuantity(bookId: number) {
        return this.put(`/admin/secure/decrease/book/quantity?bookId=${bookId}`);
    }

    async deleteBook(bookId: number) {
        return this.delete(`/admin/secure/delete/book?bookId=${bookId}`);
    }

    async getAdminMessages(page = 0, size = 5) {
        return this.get(`/messages/search/findByClosed?closed=false&page=${page}&size=${size}`);
    }

    async respondToMessage(id: number, response: string) {
        return this.put('/messages/secure/admin/message', { id, response });
    }

    // Payment endpoints
    async getFees(userEmail: string) {
        return this.get(`/payments/search/findByUserEmail?userEmail=${userEmail}`);
    }

    async createPaymentIntent(amount: number, currency: string, userEmail: string) {
        return this.post('/payment/secure/payment-intent', {
            amount,
            currency,
            receiptEmail: userEmail,
        });
    }

    async completePayment() {
        return this.put('/payment/secure/payment-complete');
    }

    // History endpoints
    async getHistory(userEmail: string, page = 0, size = 5) {
        return this.get(`/histories/search/findBooksByUserEmail?userEmail=${userEmail}&page=${page}&size=${size}`);
    }
}

export const apiService = new ApiService(); 