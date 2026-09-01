import type { Page } from '../models/apiModels';
import type { Order } from '../data/orders';
import type { SavedAddress, User } from '../data/user';
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient';

export type Profile = Omit<User, 'addresses'>;

export const getProfile = (signal?: AbortSignal) => apiGet<Profile>('/me', { signal });

export const updateProfile = (changes: Partial<Pick<User, 'fullName' | 'phone' | 'preferences'>>) =>
    apiPatch<Profile>('/me', changes);

export const getAddresses = (signal?: AbortSignal) =>
    apiGet<{ data: SavedAddress[] }>('/addresses', { signal }).then(({ data }) => data);

export const createAddress = (address: Omit<SavedAddress, 'id'>) =>
    apiPost<SavedAddress>('/addresses', address);

export const updateAddress = (id: string, changes: Partial<Omit<SavedAddress, 'id'>>) =>
    apiPatch<SavedAddress>(`/addresses/${encodeURIComponent(id)}`, changes);

export const deleteAddress = (id: string) => apiDelete(`/addresses/${encodeURIComponent(id)}`);

export const getOrders = (signal?: AbortSignal) =>
    apiGet<Page<Order>>('/orders', { signal }).then(({ data }) => data);

export const getOrder = (id: string, signal?: AbortSignal) =>
    apiGet<Order>(`/orders/${encodeURIComponent(id)}`, { signal });
