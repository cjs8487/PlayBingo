import {
    Avatar,
    Box,
    Card,
    CardActionArea,
    Link,
    Typography,
} from '@mui/material';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

const repositoryUrl = 'https://github.com/cjs8487/PlayBingo';

const contributorSchema = z.object({
    id: z.number(),
    login: z.string(),
    contributions: z.number().int().nonnegative(),
    avatar_url: z.string().url(),
});

async function getGithubContributors() {
    'use cache';

    cacheLife('hours');
    const contributors: z.infer<typeof contributorSchema>[] = [];
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    for (let page = 1; ; page++) {
        const response = await fetch(
            `https://api.github.com/repos/cjs8487/PlayBingo/contributors?per_page=100&page=${page}`,
            {
                headers,
                signal: AbortSignal.timeout(10000),
            },
        );
        if (!response.ok) {
            throw new Error(
                `GitHub contributors request failed (${response.status})`,
            );
        }
        if (response.status === 204) return contributors;

        const batch = z.array(contributorSchema).parse(await response.json());
        contributors.push(
            ...batch.filter(
                ({ login }) =>
                    ![
                        'dependabot',
                        'dependabot[bot]',
                        'dependabot-preview[bot]',
                    ].includes(login.toLowerCase()),
            ),
        );
        if (!response.headers.get('link')?.includes('rel="next"')) {
            return contributors;
        }
    }
}

export default async function ContributorsCard() {
    const contributors = await getGithubContributors().catch(() => null);

    return (
        <Box sx={{ pb: 4 }}>
            {contributors && contributors.length > 0 ? (
                <Box
                    component="ul"
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            md: 'repeat(3, minmax(0, 1fr))',
                        },
                        gap: 2,
                        p: 0,
                        m: 0,
                        mb: 1,
                        listStyle: 'none',
                    }}
                >
                    {contributors.map((contributor) => (
                        <Card
                            component="li"
                            variant="outlined"
                            key={contributor.id}
                        >
                            <CardActionArea
                                component="a"
                                href={`https://github.com/${encodeURIComponent(contributor.login)}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 2,
                                    height: '100%',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                <Avatar
                                    src={contributor.avatar_url}
                                    alt=""
                                    sx={{ width: 56, height: 56 }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        component="h3"
                                        variant="subtitle1"
                                        sx={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {contributor.login}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {contributor.contributions.toLocaleString(
                                            'en-US',
                                        )}{' '}
                                        {contributor.contributions === 1
                                            ? 'commit'
                                            : 'commits'}
                                    </Typography>
                                </Box>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {contributors
                        ? 'Contributor information will appear here once available.'
                        : 'Contributor information is temporarily unavailable. You can view our contributors on GitHub.'}
                </Typography>
            )}
            <Link href={`${repositoryUrl}/graphs/contributors`}>
                View contributions on GitHub
            </Link>
        </Box>
    );
}
