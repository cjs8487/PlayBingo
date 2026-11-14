import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Menu,
    MenuItem,
    TextField,
} from '@mui/material';
import { useId, useState } from 'react';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';

export default function TeamControls() {
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
        connectedPlayer,
        nickname,
        roomData,
        teams,
        connectedTeam,
        joinTeam,
    } = useRoomContext();
    const connected = connectionStatus === ConnectionStatus.CONNECTED;

    if (!roomData?.teamsEnabled || !connectedTeam) return null;

    const canSaveTeamName = Boolean(
        teamNameDraft?.name.trim() &&
        (teamNameDraft.id === null ||
            (teamNameDraft.id === connectedTeam.id &&
                teamNameDraft.name.trim() !== connectedTeam.name)) &&
        connected,
    );

    return (
        <>
            <Button
                size="small"
                sx={{ py: 0 }}
                aria-haspopup="menu"
                aria-expanded={teamMenuAnchor ? true : undefined}
                aria-controls={teamMenuAnchor ? teamMenuId : undefined}
                disabled={!connected}
                onClick={(event) => setTeamMenuAnchor(event.currentTarget)}
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
                    disabled={!connected}
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
                    disabled={!connected}
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
                        aria-checked={team.id === connectedTeam.id}
                        disabled={!connected}
                        selected={team.id === connectedTeam.id}
                        onClick={() => {
                            joinTeam(team.id);
                            setTeamMenuAnchor(null);
                        }}
                    >
                        {team.name}
                    </MenuItem>
                ))}
            </Menu>
            <Dialog
                open={Boolean(
                    teamNameDraft &&
                    (teamNameDraft.id === null ||
                        teamNameDraft.id === connectedTeam.id),
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
        </>
    );
}
