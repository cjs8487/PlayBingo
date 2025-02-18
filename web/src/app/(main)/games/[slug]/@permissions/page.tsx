import AddIcon from '@mui/icons-material/Add';
import { Box, Typography } from '@mui/material';
import {
    addModerators,
    addOwners,
    removeModerator,
    removeOwner,
} from '../../../../../actions/Game';
import UserSearch from '../../../../../components/UserSearch';
import { GamePageParams } from '../layout';
import UserEntry from './UserEntry';
import { User } from '../../../../../types/User';

async function getOwners(slug: string): Promise<User[] | null> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/games/${slug}/owners`,
    );
    if (!res.ok) {
        return null;
    }
    return res.json();
}

async function getModerators(slug: string): Promise<User[] | null> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/games/${slug}/moderators`,
    );
    if (!res.ok) {
        return null;
    }
    return res.json();
}

export default async function PermissionsManagement({
    params,
}: GamePageParams) {
    const { slug } = await params;

    const ownerPromise = getOwners(slug);
    const modPromise = getModerators(slug);

    const [owners, moderators] = await Promise.all([ownerPromise, modPromise]);

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
                    {owners?.map((owner) => (
                        <UserEntry
                            slug={slug}
                            key={owner.id}
                            user={owner}
                            canRemove={!!owners?.length && owners.length > 1}
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
                    {moderators?.map((mod) => (
                        <UserEntry
                            slug={slug}
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
