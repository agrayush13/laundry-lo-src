import { useParams } from 'react-router-dom';
import { getOrder } from '../services/customerServices';
import { useAsync } from './useAsync';

/** Loads only the signed-in customer's order named in the route. */
export const useOrder = () => {
    const { orderId } = useParams();
    return useAsync(
        (signal) =>
            orderId ? getOrder(orderId, signal) : Promise.reject(new Error('Missing order id')),
        [orderId]
    );
};
