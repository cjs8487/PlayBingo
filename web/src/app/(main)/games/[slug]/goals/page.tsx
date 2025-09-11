import GoalManagement from '@/app/(main)/games/[slug]/goals/_components/GoalManagement';
import { GoalManagerContextProvider } from '@/context/GoalManagerContext';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GameGoals({ params }: Props) {
    const { slug } = await params;

    return (
        <GoalManagerContextProvider slug={slug} canModerate>
            <GoalManagement />
        </GoalManagerContextProvider>
    );
}
