import { Box } from '@mui/material';
import { PropsWithChildren } from 'react';

interface CardHiddenActionsProps extends PropsWithChildren {
    align?: 'left' | 'center' | 'right';
}

export default function CardHiddenActions({
    children,
    align,
}: CardHiddenActionsProps) {
    return (
        <Box
            className="hidden-controls"
            sx={{
                position: 'absolute',
                top: 8,
                left: align === 'left' ? 8 : 'auto',
                right: align === 'right' ? 8 : 'auto',
                display: 'flex',
                justifyContent:
                    align === 'center' ? 'center' : 'flex-start',
                width: align === 'center' ? '100%' : 'auto'
            }}
        >
            <Box sx={{
                zIndex: 1
            }}>{children}</Box>
        </Box>
    );
}
