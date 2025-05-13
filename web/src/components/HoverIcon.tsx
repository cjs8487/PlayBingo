import { useFloating, useHover, useInteractions } from '@floating-ui/react';
import { Paper, Tooltip } from '@mui/material';
import { ReactElement, ReactNode, useState } from 'react';

interface HoverIconProps {
    icon: ReactElement;
    children: ReactNode;
}

export default function HoverIcon({ icon, children }: HoverIconProps) {
    return <Tooltip title={children}>{icon}</Tooltip>;
}
