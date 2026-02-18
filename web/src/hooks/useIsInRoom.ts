import { usePathname } from 'next/navigation';

/**
 * Hook to detect if the current page is a room page
 * @returns boolean indicating if user is currently in a room
 */
export function useIsInRoom(): boolean {
    const pathname = usePathname();
    return pathname?.startsWith('/rooms/') ?? false;
}
