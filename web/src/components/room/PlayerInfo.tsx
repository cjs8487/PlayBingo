import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    FormControlLabel,
    Switch,
    Menu,
    Divider,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';
import ColorSelect from './ColorSelect';
import { Sword } from 'mdi-material-ui';
import { useId, useState } from 'react';

export default function PlayerInfo() {
    const teamMenuId = useId();
    const [teamMenuAnchor, setTeamMenuAnchor] = useState<HTMLElement | null>(
        null,
    );
    const [teamNameDraft, setTeamNameDraft] = useState<{
        id: string | null;
        name: string;
    } | null>(null);
    const {
        connectionStatus,
        nickname,
        disconnect,
        showGoalDetails,
        toggleGoalDetails,
        showCounters,
        toggleCounters,
        connectedPlayer,
        changeAuth,
        showImages,
        toggleImages,
        roomData,
        teams,
        connectedTeam,
        joinTeam,
        notificationSoundEnabled,
        toggleNotificationSound,
    } = useRoomContext();

    const canSaveTeamName = Boolean(
        roomData?.teamsEnabled &&
        teamNameDraft?.name.trim() &&
        connectedTeam &&
        (teamNameDraft.id === null ||
            (teamNameDraft.id === connectedTeam.id &&
                teamNameDraft.name.trim() !== connectedTeam.name)) &&
        connectionStatus === ConnectionStatus.CONNECTED,
    );

    return (
        <Card>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        columnGap: 1,
                    }}
                >
                    <Typography variant="h6">
                        {!connectedPlayer?.teamId ? 'Spectating' : 'Playing'} as{' '}
                        {connectedPlayer?.nickname ?? nickname}
                    </Typography>
                    {connectedPlayer?.monitor && (
                        <Sword sx={{ color: 'green' }} />
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    {connectionStatus !== ConnectionStatus.CLOSED && (
                        <>
                            {!connectedPlayer?.teamId ? (
                                <Button onClick={() => changeAuth(false)}>
                                    Join Game
                                </Button>
                            ) : (
                                <Button onClick={() => changeAuth(true)}>
                                    Spectate
                                </Button>
                            )}
                            <Button onClick={disconnect}>Disconnect</Button>
                        </>
                    )}
                </Box>
                {connectedTeam && (
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            }}
                        >
                            <Typography>
                                {roomData?.teamsEnabled
                                    ? 'Choose your team color'
                                    : 'Choose your color'}
                            </Typography>
                            {roomData?.teamsEnabled && (
                                <>
                                    <Button
                                        size="small"
                                        sx={{ py: 0 }}
                                        aria-haspopup="menu"
                                        aria-expanded={
                                            teamMenuAnchor ? true : undefined
                                        }
                                        aria-controls={
                                            teamMenuAnchor
                                                ? teamMenuId
                                                : undefined
                                        }
                                        disabled={
                                            connectionStatus !==
                                            ConnectionStatus.CONNECTED
                                        }
                                        onClick={(event) =>
                                            setTeamMenuAnchor(
                                                event.currentTarget,
                                            )
                                        }
                                    >
                                        Change team
                                    </Button>
                                    <Menu
                                        id={teamMenuId}
                                        anchorEl={teamMenuAnchor}
                                        open={Boolean(teamMenuAnchor)}
                                        onClose={() => setTeamMenuAnchor(null)}
                                        slotProps={{
                                            list: {
                                                'aria-label': 'Change team',
                                            },
                                        }}
                                    >
                                        <MenuItem
                                            disabled={
                                                connectionStatus !==
                                                ConnectionStatus.CONNECTED
                                            }
                                            onClick={() => {
                                                setTeamNameDraft({
                                                    id: connectedTeam.id,
                                                    name: connectedTeam.name,
                                                });
                                                setTeamMenuAnchor(null);
                                            }}
                                        >
                                            Rename team
                                        </MenuItem>
                                        <MenuItem
                                            disabled={
                                                connectionStatus !==
                                                ConnectionStatus.CONNECTED
                                            }
                                            onClick={() => {
                                                setTeamNameDraft({
                                                    id: null,
                                                    name: `${connectedPlayer?.nickname ?? nickname}'s Team`,
                                                });
                                                setTeamMenuAnchor(null);
                                            }}
                                        >
                                            Start a new team
                                        </MenuItem>
                                        <Divider />
                                        {teams.map((team) => (
                                            <MenuItem
                                                key={team.id}
                                                role="menuitemradio"
                                                aria-checked={
                                                    team.id === connectedTeam.id
                                                }
                                                disabled={
                                                    connectionStatus !==
                                                    ConnectionStatus.CONNECTED
                                                }
                                                selected={
                                                    team.id === connectedTeam.id
                                                }
                                                onClick={() => {
                                                    joinTeam(team.id);
                                                    setTeamMenuAnchor(null);
                                                }}
                                            >
                                                {team.name}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </>
                            )}
                        </Box>
                        <ColorSelect />
                    </Box>
                )}
                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="h6">Settings</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCounters}
                                onChange={toggleCounters}
                            />
                        }
                        label="Show Counters"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showGoalDetails}
                                onChange={toggleGoalDetails}
                            />
                        }
                        label="Show All Goal Details"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showImages}
                                onChange={toggleImages}
                            />
                        }
                        label="Show Images"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={notificationSoundEnabled}
                                onChange={toggleNotificationSound}
                            />
                        }
                        label="Notification Sound"
                    />
                </Box>
            </CardContent>
            <Dialog
                open={Boolean(
                    teamNameDraft &&
                    connectedTeam &&
                    (teamNameDraft.id === null ||
                        teamNameDraft.id === connectedTeam.id) &&
                    roomData?.teamsEnabled,
                )}
                onClose={() => setTeamNameDraft(null)}
                fullWidth
                maxWidth="xs"
            >
                <Box
                    component="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!canSaveTeamName || !teamNameDraft) return;
                        joinTeam(teamNameDraft.id, teamNameDraft.name);
                        setTeamNameDraft(null);
                    }}
                >
                    <DialogTitle>
                        {teamNameDraft?.id === null
                            ? 'Start a new team'
                            : 'Rename team'}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Team name"
                            value={teamNameDraft?.name ?? ''}
                            onChange={(event) => {
                                if (teamNameDraft)
                                    setTeamNameDraft({
                                        ...teamNameDraft,
                                        name: event.target.value,
                                    });
                            }}
                            autoFocus
                            required
                            fullWidth
                            margin="dense"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setTeamNameDraft(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canSaveTeamName}>
                            {teamNameDraft?.id === null
                                ? 'Create team'
                                : 'Save'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Card>
    );
}
