'use client';
import { RoomContext } from '@/context/RoomContext';
import {
    Box,
    Button,
    ButtonBase,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useContext, useRef, useState } from 'react';
import PlayerRaceSummary from './PlayerRaceSummary';
import { Team } from '@playbingo/types';
import Dialog, { DialogRef } from '../Dialog';

export default function PlayerList() {
    const {
        teams,
        spectators: allSpectators,
        roomData,
        joinTeam,
    } = useContext(RoomContext);

    const settingsDialogRef = useRef<DialogRef>(null);
    const [settingsDialogName, setSettingsDialogName] = useState('');
    const [settingsDialogTeamId, setSettingsDialogTeamId] = useState<
        string | null
    >('');

    const spectators = allSpectators.filter((player) => player.showInRoom);

    if (!roomData) {
        return null;
    }

    return (
        <>
            {teams.map((team) => (
                <TeamDisplay
                    key={team.id}
                    team={team}
                    settingsDialogRef={settingsDialogRef}
                    setSettingsDialogTeamId={setSettingsDialogTeamId}
                    setSettingsDialogName={setSettingsDialogName}
                />
            ))}
            {spectators.length > 0 && (
                <>
                    <Typography variant="h6">Spectators</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 3,
                        }}
                    >
                        {spectators.map((player) => (
                            <Box key={player.id}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        columnGap: 2,
                                    }}
                                >
                                    <Typography>{player.nickname}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
            {roomData?.teamsEnabled && (
                <>
                    <Button
                        onClick={() => {
                            settingsDialogRef.current?.open();
                            setSettingsDialogTeamId(null);
                            setSettingsDialogName('');
                        }}
                    >
                        New Team
                    </Button>
                    <Dialog ref={settingsDialogRef}>
                        <DialogTitle>New Team</DialogTitle>
                        <DialogContent>
                            <TextField
                                label="Team name"
                                autoFocus
                                required
                                fullWidth
                                margin="dense"
                                value={settingsDialogName}
                                onChange={(e) =>
                                    setSettingsDialogName(e.target.value)
                                }
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => {
                                    settingsDialogRef.current?.close();
                                    setSettingsDialogTeamId(null);
                                    setSettingsDialogName('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    joinTeam(
                                        settingsDialogTeamId,
                                        settingsDialogName,
                                    );
                                    settingsDialogRef.current?.close();
                                    setSettingsDialogTeamId(null);
                                    setSettingsDialogName('');
                                }}
                            >
                                Create Team
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
}

interface TeamDisplayProps {
    team: Team;
    settingsDialogRef: React.RefObject<DialogRef | null>;
    setSettingsDialogTeamId: React.Dispatch<
        React.SetStateAction<string | null>
    >;
    setSettingsDialogName: React.Dispatch<React.SetStateAction<string>>;
}

function TeamDisplay({
    team,
    settingsDialogRef,
    setSettingsDialogTeamId,
    setSettingsDialogName,
}: TeamDisplayProps) {
    const { roomData, connectedTeam, joinTeam } = useContext(RoomContext);

    const [showAlt, setShowAlt] = useState(false);

    const members = team.players.filter((player) => player.showInRoom);
    if (members.length === 0) {
        return null;
    }

    const isCurrentTeam = team.id === connectedTeam?.id;

    return (
        <ButtonBase
            key={team.id}
            sx={{
                borderLeft: 6,
                borderColor: team.color,
                boxShadow: `0 0 6px ${team.color}`,
                mb: 2,
                display: 'flex',
                width: '100%',
                textAlign: 'left',
            }}
            onMouseEnter={() => setShowAlt(true)}
            onMouseLeave={() => setShowAlt(false)}
            onClick={() => {
                if (isCurrentTeam) {
                    settingsDialogRef.current?.open();
                    setSettingsDialogTeamId(team.id);
                    setSettingsDialogName(team.name);
                } else {
                    joinTeam(team.id);
                }
            }}
        >
            <Box
                sx={{
                    alignSelf: 'stretch',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: team.color,
                    mr: 1,
                    px: 1.5,
                }}
            >
                <Typography>{team.goalCount}</Typography>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    height: showAlt ? '100%' : 0,
                    width: showAlt ? '100%' : 0,
                    background: team.color,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transitionProperty: 'widhth, height',
                    transitionDuration: '0.1s',
                    transitionTimingFunction: 'ease-in-out',
                }}
            >
                {showAlt && (
                    <Typography>
                        {isCurrentTeam ? 'Modify Team' : 'Join Team'}
                    </Typography>
                )}
            </Box>
            <Box sx={{ p: 0.5, flexGrow: 1 }}>
                {roomData?.teamsEnabled && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography sx={{ flexGrow: 1, pb: 0.5 }}>
                            {team.name}
                        </Typography>
                    </Box>
                )}
                {members.map((player) => (
                    <Box
                        key={player.id}
                        sx={{
                            p: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography sx={{ flexGrow: 1 }}>
                            {player.nickname}
                        </Typography>
                        <PlayerRaceSummary
                            raceHandler={roomData?.raceHandler}
                            player={player}
                        />
                        {player.monitor && (
                            <Sword
                                titleAccess="Room monitor"
                                fontSize="small"
                                sx={{ color: 'green', ml: 2 }}
                            />
                        )}
                    </Box>
                ))}
            </Box>
        </ButtonBase>
    );
}
