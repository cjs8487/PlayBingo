import { Tooltip } from '@mui/material';
import { ReactElement, ReactNode } from 'react';

interface HoverIconProps {
    icon: ReactElement;
    children: ReactNode;
}

export default function HoverIcon({ icon, children }: HoverIconProps) {
    return <Tooltip title={children}>{icon}</Tooltip>;
}
