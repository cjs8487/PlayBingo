'use client';
import { User } from '@playbingo/types';
import { useRouter } from 'next/navigation';
import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useState,
} from 'react';
import { logout } from '../actions/Session';
import { alertError } from '../lib/Utils';

interface UserContext {
    loggedIn: boolean;
    user?: User;
    checkSession: () => Promise<void>;
    logout: () => Promise<void>;
}

export const UserContext = createContext<UserContext>({
    loggedIn: false,
    async checkSession() {},
    async logout() {},
});

export const UserContextProvider = ({ children }: React.PropsWithChildren) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [checkDone, setCheckDone] = useState(false);
    const [user, setUser] = useState<User>();
    const router = useRouter();

    const checkSession = useCallback(async () => {
        const res = await fetch('/api/me');
        if (res.ok) {
            const user = await res.json();
            setUser(user);
            setLoggedIn(true);
        } else {
            setUser(undefined);
            setLoggedIn(false);
        }
        setCheckDone(true);
    }, []);

    const doLogout = useCallback(async () => {
        const res = await logout();
        if (!res.ok) {
            if (res.status === 500) {
                alertError(
                    'Unable to process logout request. Try again in a few moments.',
                );
                return;
            }
        }
        setUser(undefined);
        setLoggedIn(false);
        router.push('/');
    }, [router]);

    useLayoutEffect(() => {
        const doCheck = () => {
            checkSession();
        };
        doCheck();
    }, [checkSession]);

    if (!checkDone) {
        return null;
    }

    return (
        <UserContext.Provider
            value={{ loggedIn, user, checkSession, logout: doLogout }}
        >
            {children}
        </UserContext.Provider>
    );
};

export function useUserContext() {
    return useContext(UserContext);
}
