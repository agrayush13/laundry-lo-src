import { useParams } from 'react-router-dom';
import { getOrder } from '../data/orders';

/** Looks up the order named in the route. */
export const useOrder = () => {
    const { orderId } = useParams();
    return orderId ? getOrder(orderId) : undefined;
};
