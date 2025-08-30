'use client';
import { Game } from '@playbingo/types';
import {
    Box,
    Button,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { ExpandMore, Clear } from '@mui/icons-material';
import { inputBaseClasses } from '@mui/material/InputBase';
import Link from 'next/link';
import React, { useContext, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { UserContext } from '../../../context/UserContext';
import { useApi } from '../../../lib/Hooks';
import GameCard from '../rooms/GameCard';

const modKey = 'Moderated Games';
const favoritesKey = 'Favorites';
const allKey = 'All Games';

type gamesKeys = typeof modKey | typeof favoritesKey | typeof allKey;
type GamesKeys = gamesKeys[number];

export default function Games(): React.ReactNode {
    const { user, loggedIn } = useContext(UserContext);

    const [searchString, updateSearchString] = useState<string>('');

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

    const handleAccordionChange = (key: GamesKeys) => () => {
        if (!collapsedSections) return;
        const newState = collapsedSections;
        newState[key] = !collapsedSections[key];
        setCollapsedSections(newState);
    };

    if (!gameList || isLoading) {
        return null;
    }

    if (error) {
        return 'Unable to load game list.';
    }

    const gamesBase: { [k in GamesKeys]: Game[] } = {
        [allKey]: [],
        [favoritesKey]: [],
        [modKey]: [],
    };

    const filteredList = searchString
        ? gameList.filter((game) =>
              searchString
                  ? game.name
                        .toLowerCase()
                        .includes(searchString.toLowerCase()) ||
                    game.slug.toLowerCase().includes(searchString.toLowerCase())
                  : true,
          )
        : gameList;
    const games = filteredList.reduce<{ [k in GamesKeys]: Game[] }>(
        (curr: { [k in GamesKeys]: Game[] }, game) => {
            if (loggedIn && user && game.isMod) {
                curr[modKey].push(game);
            }
            if (game.favorited || localFavorites?.includes(game.slug)) {
                curr[favoritesKey].push(game);
            }
            curr[allKey].push(game);

            return curr;
        },
        gamesBase,
    );

    Object.values(games).forEach((list: Game[]) =>
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
                    gap: 2,
                    mb: 4,
                    py: 1,
                    borderBottom: 2,
                    borderColor: 'divider',
                    flexWrap: 'wrap',
                }}
            >
                <Typography>{gameList.length} games loaded</Typography>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        maxWidth: '50%',
                    }}
                >
                    <TextField
                        label="Search games"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchString}
                        onChange={(e) => updateSearchString(e.target.value)}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        sx={{
                                            alignSelf: 'flex-end',
                                            opacity: 0,
                                            [`[data-shrink=true] ~ .${inputBaseClasses.root} > &`]:
                                                {
                                                    opacity: 1,
                                                },
                                            alignItems: 'center',
                                        }}
                                    >
                                        <IconButton
                                            onClick={() =>
                                                updateSearchString('')
                                            }
                                            size="small"
                                            sx={{ ml: 1, whiteSpace: 'nowrap' }}
                                        >
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                {searchString && (
                    <Typography>Found {filteredList.length} games</Typography>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {loggedIn && (
                    <Button href="/games/new" LinkComponent={Link}>
                        Create a new game
                    </Button>
                )}
            </Box>
            {Object.keys(games)
                .filter((k) => games[k as GamesKeys].length > 0)
                .map((k) => {
                    // need to specifically type key as GamesKeys here so ts can properly reduce the string
                    const key: GamesKeys = k as GamesKeys;
                    const filteredGames = games[key];

                    if (filteredGames.length === 0) return null;

                    // this is always defined because we initialize the value, alltho even if it wasn't we'd still get a falsy value
                    const isCollapsed = collapsedSections![key];
                    return (
                        <Accordion
                            expanded={!isCollapsed}
                            onChange={handleAccordionChange(key)}
                            sx={{
                                background: 'transparent',
                            }}
                            key={k}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h5" sx={{ lineHeight: 1 }}>
                                    {key}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
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
                                        <Grid key={game.slug}>
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
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
        </Box>
    );
}
