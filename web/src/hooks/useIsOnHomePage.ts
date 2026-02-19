import { usePathname } from 'next/navigation';

/**
 * Hook to detect if the current page is the home page
 * @returns boolean indicating if user is currently on the home page
 */
export function useIsOnHomePage(): boolean {
    const pathname = usePathname();
    return pathname === '/';
}
