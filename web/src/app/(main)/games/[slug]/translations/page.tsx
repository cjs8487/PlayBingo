import { getFullUrl } from '../../../../../lib/Utils';
import { serverFetch } from '../../../../ServerUtils';
import Languages from './_components/languages';

async function getLanguages(slug: string): Promise<string[] | undefined> {
    const res = await serverFetch(
        getFullUrl(`/api/games/${slug}/translations`),
    );
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GamePermissions({ params }: Props) {
    const { slug } = await params;

    const languages = await getLanguages(slug);

    if (!languages) {
        return null;
    }

    return <Languages slug={slug} languages={languages} />;
}
