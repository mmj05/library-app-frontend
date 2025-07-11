import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { SpinnerLoading } from '../Utils/SpinnerLoading';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Link } from 'react-router-dom';
import { apiService } from '../../lib/apiService';

export const PaymentPage = () => {
    const { authState } = useAuth();
    const [httpError, setHttpError] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [fees, setFees] = useState(0);
    const [loadingFees, setLoadingFees] = useState(true);

    useEffect(() => {
        const fetchFees = async () => {
            if (authState && authState.isAuthenticated && authState.user?.email) {
                const paymentResponseJson = await apiService.getFees(authState.user.email);
                setFees(paymentResponseJson.amount);
                setLoadingFees(false);
            }
        };
        fetchFees().catch((error: any) => {
            setLoadingFees(false);
            setHttpError(error.message);
        });
    }, [authState]);

    const elements = useElements();
    const stripe = useStripe();

    async function checkout() {
        if (!stripe || !elements || !elements.getElement(CardElement)) {
            return;
        }

        setSubmitDisabled(true);

        try {
            const stripeResponseJson = await apiService.createPaymentIntent(
                Math.round(fees * 100),
                'USD',
                authState?.user?.email || ''
            );

            // Check if this is a mock payment (for development/testing)
            if (stripeResponseJson.client_secret.startsWith('pi_mock')) {
                // Handle mock payment - skip Stripe confirmation
                try {
                    await apiService.completePayment();
                    setFees(0);
                    setSubmitDisabled(false);
                    alert('Payment completed successfully! (Mock payment for development)');
                } catch (error: any) {
                    console.error('Payment completion error:', error);
                    setSubmitDisabled(false);
                    alert('There was an error completing the mock payment. Please contact support.');
                }
            } else {
                // Handle real Stripe payment
                stripe
                    .confirmCardPayment(
                        stripeResponseJson.client_secret,
                        {
                            payment_method: {
                                card: elements.getElement(CardElement)!,
                                billing_details: {
                                    email: authState?.user?.email,
                                },
                            },
                        },
                        { handleActions: false }
                    )
                    .then(async function (result: any) {
                        if (result.error) {
                            setSubmitDisabled(false);
                            alert('There was an error processing your payment');
                        } else {
                            try {
                                await apiService.completePayment();
                                setFees(0);
                                setSubmitDisabled(false);
                                alert('Payment completed successfully!');
                            } catch (error: any) {
                                console.error('Payment completion error:', error);
                                setSubmitDisabled(false);
                                alert('Payment was processed but there was an error completing the transaction. Please contact support.');
                            }
                        }
                    })
                    .catch((error: any) => {
                        console.error('Stripe payment confirmation error:', error);
                        setSubmitDisabled(false);
                        alert('There was an error processing your payment');
                    });
            }
            setHttpError(false);
        } catch (error: any) {
            console.error('Payment intent creation error:', error);
            setSubmitDisabled(false);
            
            if (error.response?.status === 403) {
                alert('Authentication failed. Please log out and log in again.');
            } else if (error.response?.status === 401) {
                alert('Your session has expired. Please log in again.');
            } else {
                alert('There was an error creating the payment. Please try again.');
            }
        }
    }

    if (loadingFees) {
        return <SpinnerLoading />;
    }

    if (httpError) {
        return (
            <div className='container m-5'>
                <p>{httpError}</p>
            </div>
        );
    }

    return (
        <div className='container'>
            {fees > 0 && (
                <div className='card mt-3'>
                    <h5 className='card-header'>
                        Fees pending: <span className='text-danger'>${fees}</span>
                    </h5>
                    <div className='card-body'>
                        <h5 className='card-title mb-3'>Credit Card</h5>
                        <CardElement id='card-element' />
                        <button
                            disabled={submitDisabled}
                            type='button'
                            className='btn btn-md main-color text-white mt-3'
                            onClick={checkout}
                        >
                            Pay fees
                        </button>
                    </div>
                </div>
            )}

            {fees === 0 && (
                <div className='mt-3'>
                    <h5>You have no fees!</h5>
                    <Link
                        type='button'
                        className='btn main-color text-white'
                        to='search'
                    >
                        Explore top books
                    </Link>
                </div>
            )}
            {submitDisabled && <SpinnerLoading />}
        </div>
    );
};
