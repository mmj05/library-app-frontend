import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from 'react';
import MessageModel from '../../../models/MessageModel';
import { Pagination } from '../../Utils/Pagination';
import { SpinnerLoading } from '../../Utils/SpinnerLoading';
import { AdminMessage } from './AdminMessage';
import { apiService } from '../../../lib/apiService';

export const AdminMessages = () => {
    const { authState } = useAuth();

    // Normal Loading Pieces
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [httpError, setHttpError] = useState(null);

    // Messages endpoint State
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const [messagesPerPage] = useState(5);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Recall useEffect
    const [btnSubmit, setBtnSubmit] = useState(false);

    useEffect(() => {
        const fetchUserMessages = async () => {
            if (authState && authState.isAuthenticated) {
                const messagesResponseJson = await apiService.getAdminMessages(currentPage - 1, messagesPerPage);
                setMessages(messagesResponseJson._embedded.messages);
                setTotalPages(messagesResponseJson.page.totalPages);
            }
            setIsLoadingMessages(false);
        };
        fetchUserMessages().catch((error: any) => {
            setIsLoadingMessages(false);
            setHttpError(error.message);
        });
        window.scrollTo(0, 0);
    }, [authState, currentPage, btnSubmit, messagesPerPage]);

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

    async function submitResponseToQuestion(id: number, response: string) {
        if (authState && authState?.isAuthenticated && id !== null && response !== '') {
            await apiService.respondToMessage(id, response);
            setBtnSubmit(!btnSubmit);
        }
    }

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className='mt-3'>
            {messages.length > 0 ? (
                <>
                    <h5>Pending Q/A: </h5>
                    {messages.map((message) => (
                        <AdminMessage message={message} key={message.id} submitResponseToQuestion={submitResponseToQuestion}/>
                    ))}
                </>
            ) : (
                <h5>No pending Q/A</h5>
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
