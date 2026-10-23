import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    FormControlLabel,
    Switch,
    Menu,
    MenuItem,
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
    } = useRoomContext();

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
                </Box>
            </CardContent>
        </Card>
    );
}
