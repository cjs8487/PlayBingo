'use client';
import { Game } from '@playbingo/types';
import Grid from '@mui/material/Grid';
import {
    Box,
    Button,
    Typography,
    Collapse,
    IconButton,
    TextField,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import Link from 'next/link';
import React, { useContext, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { UserContext } from '../../../context/UserContext';
import { useApi } from '../../../lib/Hooks';
import { isUserModerator } from '../../../lib/Utils';
import GameCard from '../rooms/GameCard';

const modKey = 'Moderated Games';
const favoritesKey = 'Favorites';
const allKey = 'All Games';

const gamesKeys = [modKey, favoritesKey, allKey] as const;
type GamesKeys = (typeof gamesKeys)[number];

export default function Games(): React.ReactNode {
    const { user, loggedIn } = useContext(UserContext);

    const { searchString, updateSearchString } = useState<string>('');

    const { data: gameList, isLoading, error } = useApi<Game[]>('/api/games');

    const [localFavorites, setLocalFavorites] = useLocalStorage<string[]>(
        'playbingo-favorites',
        [],
    );

    const [collapsedSections, setCollapsedSections] = useLocalStorage<
        Record<GamesKeys, boolean>
    >('playbingo-gameslist-sections', {
        [allKey]: false,
        [favoritesKey]: false,
        [modKey]: false,
    });

    const toggleSection = (key: GamesKeys) => {
        setCollapsedSections((prev: Record<GamesKeys, boolean>) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    if (!gameList || isLoading) {
        return null;
    }

    if (error) {
        return 'Unable to load game list.';
    }

    const gamesBase: { [k: GamesKeys]: Game[] } = {};
    gamesBase[modKey] = [];
    gamesBase[favoritesKey] = [];
    gamesBase[allKey] = [];
    const games = gameList.reduce<{ [k: GamesKeys]: Game[] }>((curr, game) => {
        if (loggedIn && user && game.isMod) {
            curr[modKey].push(game);
        }
        if (game.favorited || localFavorites?.includes(game.slug)) {
            curr[favoritesKey].push(game);
        }
        curr[allKey].push(game);

        return curr;
    }, gamesBase);
    Object.values(games).forEach((list) =>
        list.sort((a, b) => {
            if (
                (a.favorited || localFavorites?.includes(a.slug)) ===
                (b.favorited || localFavorites?.includes(b.slug))
            ) {
                return a.name.localeCompare(b.name);
            }
            return a.favorited ? -1 : 1;
        }),
    );

    return (
        <Box
            sx={{
                flexGrow: 1,
                px: 2,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 4,
                    py: 1,
                    borderBottom: 2,
                    borderColor: 'divider',
                }}
            >
                <Typography>{gameList.length} games loaded</Typography>
                <TextField
                    label="Search games"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchString}
                    onChange={(e) => updateSearchString(e.target.value)}
                    sx={{ mb: 4 }}
                />
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />
                {loggedIn && (
                    <div>
                        <Button href="/games/new" LinkComponent={Link}>
                            Create a new game
                        </Button>
                    </div>
                )}
            </Box>
            {Object.keys(games)
                .filter((k) => games[k].length > 0)
                .map((key) => {
                    const filteredGames = games[key].filter((game) =>
                        searchString
                            ? game.name
                                  .toLowerCase()
                                  .includes(searchString.toLowerCase()) ||
                              game.slug
                                  .toLowerCase()
                                  .includes(searchString.toLowerCase())
                            : true,
                    );

                    if (filteredGames.length === 0) return null;

                    // this is always defined because we initialize the value, alltho even if it wasn't we'd still get a falsy value
                    const isCollapsed = collapsedSections![key];
                    return (
                        <Box key={key} sx={{ mb: 4 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    mb: 1,
                                }}
                                onClick={() => toggleSection(key)}
                            >
                                <IconButton size="small">
                                    {isCollapsed ? (
                                        <ExpandMore />
                                    ) : (
                                        <ExpandLess />
                                    )}
                                </IconButton>
                                <Typography variant="h5" sx={{ pb: 2 }}>
                                    {key}
                                </Typography>
                            </Box>
                            <Collapse
                                in={!isCollapsed}
                                timeout="auto"
                                unmountOnExit
                            >
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 2,
                                        gridTemplateColumns: {
                                            xs: 'repeat(1, 1fr)',
                                            sm: 'repeat(2, 1fr)',
                                            md: 'repeat(4, 1fr)',
                                            lg: 'repeat(5, 1fr)',
                                            xl: 'repeat(6, 1fr)',
                                        },
                                    }}
                                >
                                    {filteredGames.map((game, index) => (
                                        <Grid item xs={1} key={game.slug}>
                                            <GameCard
                                                key={game.slug}
                                                game={game}
                                                index={index}
                                                localFavorites={localFavorites}
                                                setLocalFavorites={
                                                    setLocalFavorites
                                                }
                                            />
                                        </Grid>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
        </Box>
    );
}
