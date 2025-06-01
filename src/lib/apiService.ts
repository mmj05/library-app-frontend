import axios from 'axios';
import { API_CONFIG } from './apiConfig';

class ApiService {
    private api: any;

    constructor() {
        this.api = axios.create({
            baseURL: API_CONFIG.baseURL,
            timeout: API_CONFIG.timeout,
            headers: API_CONFIG.headers,
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            (config: any) => {
                const token = localStorage.getItem('jwtToken');
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error: any) => Promise.reject(error)
        );

        // Response interceptor to handle auth errors
        this.api.interceptors.response.use(
            (response: any) => response,
            (error: any) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('jwtToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Authentication endpoints
    async login(email: string, password: string) {
        return this.api.post('/auth/login', { email, password });
    }

    async register(email: string, password: string, firstName: string, lastName: string) {
        return this.api.post('/auth/register', { email, password, firstName, lastName });
    }

    async getCurrentUser() {
        return this.api.get('/auth/me');
    }

    // Books endpoints
    async getBooks(page = 0, size = 20) {
        return this.api.get(`/books?page=${page}&size=${size}`);
    }

    async getBook(bookId: number) {
        return this.api.get(`/books/${bookId}`);
    }

    async searchBooks(searchQuery: string, page = 0, size = 20) {
        return this.api.get(`/books/search/findByTitleContaining?title=${searchQuery}&page=${page}&size=${size}`);
    }

    async checkoutBook(bookId: number) {
        return this.api.put(`/books/secure/checkout?bookId=${bookId}`);
    }

    async returnBook(bookId: number) {
        return this.api.put(`/books/secure/return?bookId=${bookId}`);
    }

    async renewLoan(bookId: number) {
        return this.api.put(`/books/secure/renew/loan?bookId=${bookId}`);
    }

    async getCurrentLoans() {
        return this.api.get('/books/secure/currentloans');
    }

    async getCurrentLoansCount() {
        return this.api.get('/books/secure/currentloans/count');
    }

    async isBookCheckedOut(bookId: number) {
        return this.api.get(`/books/secure/ischeckedout/byuser?bookId=${bookId}`);
    }

    // Reviews endpoints
    async getReviewsByBook(bookId: number, page = 0, size = 5) {
        return this.api.get(`/reviews/search/findByBookId?bookId=${bookId}&page=${page}&size=${size}`);
    }

    async submitReview(bookId: number, rating: number, reviewDescription: string) {
        return this.api.post('/reviews/secure', {
            rating,
            bookId,
            reviewDescription,
        });
    }

    async isReviewLeft(bookId: number) {
        return this.api.get(`/reviews/secure/user/book?bookId=${bookId}`);
    }

    // Messages endpoints
    async getMessages(page = 0, size = 5) {
        return this.api.get(`/messages/search/findByUserEmail?userEmail={userEmail}&page=${page}&size=${size}`);
    }

    async postMessage(title: string, question: string) {
        return this.api.post('/messages/secure/add/message', {
            title,
            question,
        });
    }

    // Admin endpoints
    async addBook(bookData: any) {
        return this.api.post('/admin/secure/add/book', bookData);
    }

    async increaseBookQuantity(bookId: number) {
        return this.api.put(`/admin/secure/increase/book/quantity?bookId=${bookId}`);
    }

    async decreaseBookQuantity(bookId: number) {
        return this.api.put(`/admin/secure/decrease/book/quantity?bookId=${bookId}`);
    }

    async deleteBook(bookId: number) {
        return this.api.delete(`/admin/secure/delete/book?bookId=${bookId}`);
    }

    async getAdminMessages(page = 0, size = 5) {
        return this.api.get(`/messages/search/findByClosed?closed=false&page=${page}&size=${size}`);
    }

    async respondToMessage(id: number, response: string) {
        return this.api.put('/messages/secure/admin/message', { id, response });
    }

    // Payment endpoints
    async getFees() {
        return this.api.get('/payments/search/findByUserEmail?userEmail={userEmail}');
    }

    async createPaymentIntent(amount: number, currency: string, userEmail: string) {
        return this.api.post('/payment/secure/payment-intent', {
            amount,
            currency,
            receiptEmail: userEmail,
        });
    }

    async completePayment() {
        return this.api.put('/payment/secure/payment-complete');
    }

    // History endpoints
    async getHistory(page = 0, size = 5) {
        return this.api.get(`/histories/search/findBooksByUserEmail?userEmail={userEmail}&page=${page}&size=${size}`);
    }
}

export default new ApiService(); 