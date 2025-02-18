import AddIcon from '@mui/icons-material/Add';
import { Box, Typography } from '@mui/material';
import {
    addModerators,
    addOwners,
    removeModerator,
    removeOwner,
} from '../../../../../actions/Game';
import UserSearch from '../../../../../components/UserSearch';
import { GamePageParams, getGame } from '../layout';
import UserEntry from './UserEntry';

export default async function PermissionsManagement({
    params,
}: GamePageParams) {
    const { slug } = await params;
    const gameData = await getGame(slug);

    if (!gameData) {
        return null;
    }

    const ownerSubmit = addOwners.bind(null, slug);
    const modSubmit = addModerators.bind(null, slug);

    return (
        <Box>
            <Box pb={3}>
                <Typography variant="h6">Owners</Typography>
                <Typography pb={3} variant="caption">
                    Owners have full moderation powers over a game, including
                    appointing additional owners and moderators.
                </Typography>
                <Box>
                    {gameData.owners?.map((owner) => (
                        <UserEntry
                            slug={gameData.slug}
                            key={owner.id}
                            user={owner}
                            canRemove={
                                !!gameData.owners?.length &&
                                gameData.owners.length > 1
                            }
                            remove={removeOwner}
                        />
                    ))}
                </Box>

                <UserSearch
                    openButtonCaption="Add new owner"
                    openButtonIcon={<AddIcon />}
                    submit={ownerSubmit}
                    listPath={`/api/games/${slug}/eligibleMods`}
                    userTitleOverride="owners"
                />
            </Box>
            <Box>
                <Typography variant="h5">Moderators</Typography>
                <Typography variant="caption" pb={3}>
                    Moderators have the power to modify goal lists and create
                    game modes and variants, as well as modify some game
                    settings.
                </Typography>
                <div>
                    {gameData.moderators?.map((mod) => (
                        <UserEntry
                            slug={gameData.slug}
                            key={mod.id}
                            user={mod}
                            canRemove
                            remove={removeModerator}
                        />
                    ))}
                </div>
                <UserSearch
                    openButtonCaption="Add new moderator"
                    openButtonIcon={<AddIcon />}
                    submit={modSubmit}
                    listPath={`/api/games/${slug}/eligibleMods`}
                />
            </Box>
        </Box>
    );
}
