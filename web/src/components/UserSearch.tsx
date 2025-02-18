'use client';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { forwardRef, ReactNode, useCallback, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Virtuoso } from 'react-virtuoso';
import { GamePermissionResponse } from '../actions/Game';
import { useApi } from '../lib/Hooks';
import { alertError } from '../lib/Utils';
import { User } from '../types/User';
import { mutate } from 'swr';

interface UserSearchProps {
    openButtonCaption: string;
    openButtonIcon?: ReactNode;
    submit: (users: string[]) => Promise<GamePermissionResponse>;
    listPath?: string;
    userTitleOverride?: string;
}

export default function UserSearch({
    openButtonCaption,
    openButtonIcon,
    submit,
    listPath,
    userTitleOverride,
}: UserSearchProps) {
    const {
        data: users,
        isLoading,
        error,
    } = useApi<User[]>(listPath ?? '/api/users');

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [searchString, setSearchString] = useState('');

    const userTitle = userTitleOverride ?? 'users';

    const cancel = useCallback(async () => {
        setSelected([]);
        setSearchString('');
        setIsOpen(false);
    }, []);

    const onSubmit = useCallback(async () => {
        const res = await submit(selected);
        if (!res.ok) {
            alertError(`Unable to add new ${userTitle} - ${error}`);
        }
        setSelected([]);
        setSearchString('');
        setIsOpen(false);
    }, [submit, selected]);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        mutate(listPath);
    }, [isOpen]);

    if (!users || isLoading) {
        return null;
    }

    if (error) {
        alertError("Couldn't load user list.");
        return null;
    }

    let listedUsers = (users as User[])
        .toSorted((a, b) => a.username.localeCompare(b.username))
        .filter((user) => {
            if (!searchString || searchString.length === 0) {
                return true;
            }
            return (
                user.username.startsWith(searchString) ||
                user.username.includes(searchString)
            );
        });

    return (
        <>
            <Button onClick={() => setIsOpen(true)} startIcon={openButtonIcon}>
                {openButtonCaption}
            </Button>

            <Dialog
                onClose={close}
                open={isOpen}
                fullScreen={fullScreen}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>User Search</DialogTitle>
                <DialogContent sx={{ minHeight: '300px' }}>
                    <TextField
                        type="text"
                        label="Search"
                        onChange={(e) => setSearchString(e.target.value)}
                        sx={{ width: '33%' }}
                    />
                    <AutoSizer>
                        {({ height, width }) => (
                            <Virtuoso<User>
                                height={height}
                                width={width}
                                style={{ height, width }}
                                components={{
                                    // eslint-disable-next-line react/display-name
                                    List: forwardRef(
                                        ({ style, children }, listRef) => {
                                            return (
                                                <List
                                                    style={{
                                                        padding: 0,
                                                        ...style,
                                                        margin: 0,
                                                    }}
                                                    component="div"
                                                    ref={listRef}
                                                >
                                                    {children}
                                                </List>
                                            );
                                        },
                                    ),
                                    Item: ({ children, ...props }) => {
                                        return (
                                            <ListItem
                                                {...props}
                                                style={{
                                                    margin: 0,
                                                }}
                                                disableGutters
                                            >
                                                {children}
                                            </ListItem>
                                        );
                                    },
                                }}
                                data={listedUsers}
                                itemContent={(index, user) => (
                                    <ListItemButton
                                        onClick={() => {
                                            if (selected.includes(user.id)) {
                                                setSelected(
                                                    selected.filter(
                                                        (u) => u !== user.id,
                                                    ),
                                                );
                                            } else {
                                                setSelected([
                                                    ...selected,
                                                    user.id,
                                                ]);
                                            }
                                        }}
                                        divider
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={selected.includes(
                                                    user.id,
                                                )}
                                                tabIndex={-1}
                                                disableRipple
                                                inputProps={{
                                                    'aria-labelledby': `user-list-label-${index}`,
                                                }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            id={`user-list-label-${index}`}
                                        >
                                            {user.username}
                                        </ListItemText>
                                    </ListItemButton>
                                )}
                            />
                        )}
                    </AutoSizer>
                </DialogContent>
                <DialogActions>
                    <Button color="error" onClick={cancel}>
                        Cancel
                    </Button>
                    <Button type="button" color="success" onClick={onSubmit}>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
