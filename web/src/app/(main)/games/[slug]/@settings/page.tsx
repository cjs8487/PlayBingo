import { Box, Typography } from '@mui/material';
import GameHeaderControls from './SettingsHeaderControls';
import SettingsForm from './SettingsForm';
import { GamePageParams, getGame } from '../layout';

export default async function GameSettings({ params }: GamePageParams) {
    const { slug } = await params;
    const gameData = await getGame(slug);

    if (!gameData) {
        return null;
    }

    return (
        <>
            <Box display="flex">
                <Typography variant="h5" align="center" flexGrow={1}>
                    Game Settings
                </Typography>
                <GameHeaderControls slug={gameData.slug} />
            </Box>
            <SettingsForm gameData={gameData} />
        </>
    );
}
