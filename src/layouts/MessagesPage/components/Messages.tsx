import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import MessageModel from '../../../models/MessageModel';
import { SpinnerLoading } from '../../Utils/SpinnerLoading';
import { Pagination } from '../../Utils/Pagination';
import { apiService } from '../../../lib/apiService';

export const Messages = () => {
    const { authState } = useAuth();
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [httpError, setHttpError] = useState(null);

    // Messages
    const [messages, setMessages] = useState<MessageModel[]>([]);

    // Pagination
    const [messagesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const fetchUserMessages = async () => {
            if (authState && authState?.isAuthenticated && authState.user?.email) {
                const messagesResponseJson = await apiService.getMessages(authState.user.email, currentPage - 1, messagesPerPage);
                setMessages(messagesResponseJson._embedded.messages);
                setTotalPages(messagesResponseJson.page.totalPages);
            }
            setIsLoadingMessages(false);
        };
        fetchUserMessages().catch((error: any) => {
            setIsLoadingMessages(false);
            setHttpError(error.messages);
        });
        window.scrollTo(0, 0);
    }, [authState, currentPage, messagesPerPage]);

    if (isLoadingMessages) {
        return <SpinnerLoading />;
    }

    if (httpError) {
        return (
            <div className='container m-5'>
                <p>{httpError}</p>
            </div>
        );
    }

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className='mt-2'>
            {messages.length > 0 ? (
                <>
                    <h5>Current Q/A: </h5>
                    {messages.map((message) => (
                        <div key={message.id}>
                            <div className='card mt-2 shadow p-3 bg-body rounded'>
                                <h5>
                                    Case #{message.id}: {message.title}
                                </h5>
                                <h6>{message.userEmail}</h6>
                                <p>{message.question}</p>
                                <hr />
                                <div>
                                    <h5>Response: </h5>
                                    {message.response && message.adminEmail ? (
                                        <>
                                            <h6>
                                                {message.adminEmail} (admin)
                                            </h6>
                                            <p>{message.response}</p>
                                        </>
                                    ) : (
                                        <p>
                                            <i>
                                                Pending response from
                                                administration. Please be
                                                patient.
                                            </i>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <h5>All questions you submit will be shown here</h5>
            )}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            )}
        </div>
    );
};
