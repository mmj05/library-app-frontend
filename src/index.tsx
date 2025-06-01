import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';
import { BrowserRouter } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
    'pk_test_51NwtSSA6N2XryKBX3Br6bsSlD7do9s6YMgb00IVAWBVQOiSmBbGA9OmibYkzMHafelcrCXMNNiZCjAA1zLVtX1Nz00w5AInhvu'
);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <BrowserRouter>
        <Elements stripe={stripePromise}>
            <App />
        </Elements>
    </BrowserRouter>
);
