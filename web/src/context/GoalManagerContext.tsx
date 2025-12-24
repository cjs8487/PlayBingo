'use client';
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Category, Goal, GoalTag } from '@playbingo/types';
import { useApi } from '../lib/Hooks';
import { alertError } from '../lib/Utils';
import { KeyedMutator } from 'swr';

export enum SortOptions {
    DEFAULT,
    NAME,
    DIFFICULTY,
}

interface CategorySearchOption {
    value: string;
    display: string;
    isTag: boolean;
}

interface SearchParams {
    sort: SortOptions | null;
    reverse: boolean;
    search: string;
    shownCats: CategorySearchOption[];
}

interface GoalManagerSettings {
    showDetails: boolean;
}

interface GoalManagerContext {
    slug: string;
    canModerate: boolean;
    selectedGoal: Goal | undefined;
    goals: Goal[];
    shownGoals: Goal[];
    catList: Category[];
    searchParams: SearchParams;
    settings: GoalManagerSettings;
    setSelectedGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    setShownCats: (cats: CategorySearchOption[]) => void;
    setSort: (sort: SortOptions) => void;
    setReverse: Dispatch<SetStateAction<boolean>>;
    setSearch: (search: string) => void;
    setSettings: Dispatch<SetStateAction<GoalManagerSettings>>;
    mutateGoals: KeyedMutator<Goal[]>;
    newGoal: boolean;
    setNewGoal: (newGoal: boolean) => void;
    tags: GoalTag[];
}

const GoalManagerContext = createContext<GoalManagerContext>({
    slug: '',
    canModerate: false,
    selectedGoal: undefined,
    goals: [],
    shownGoals: [],
    catList: [],
    searchParams: { sort: null, reverse: false, search: '', shownCats: [] },
    settings: {
        showDetails: true,
    },
    setSelectedGoal() {},
    deleteGoal() {},
    setShownCats() {},
    setSort() {},
    setReverse() {},
    setSearch() {},
    setSettings() {},
    async mutateGoals() {
        return undefined;
    },
    newGoal: false,
    setNewGoal() {},
    tags: [],
});

interface GoalManagerContextProps {
    slug: string;
    canModerate: boolean;
    children: ReactNode;
    tags: GoalTag[];
}

export function GoalManagerContextProvider({
    slug,
    canModerate,
    children,
    tags,
}: GoalManagerContextProps) {
    // API
    const {
        data: goals,
        isLoading: goalsLoading,
        mutate: mutateGoals,
    } = useApi<Goal[]>(`/api/games/${slug}/goals?includeFullCatData=1`);

    // state
    // core
    const [selectedGoal, setSelectedGoal] = useState<Goal>();
    const [catList, setCatList] = useState<Category[]>([]);
    const [newGoal, setNewGoal] = useState(false);
    // search params
    const [sort, setSort] = useState<SortOptions | null>(SortOptions.DEFAULT);
    const [shownCats, setShownCats] = useState<CategorySearchOption[]>([]);
    const [reverse, setReverse] = useState(false);
    const [search, setSearch] = useState('');
    //settings
    const [settings, setSettings] = useState<GoalManagerSettings>({
        showDetails: true,
    });

    // callbacks
    const deleteGoal = useCallback(
        async (id: string) => {
            const res = await fetch(`/api/goals/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                const error = await res.text();
                alertError(`Failed to delete goal - ${error}`);
                return;
            }
            mutateGoals();
        },
        [mutateGoals],
    );

    /// effects
    useEffect(() => {
        const cats: Category[] = [];
        goals?.forEach((goal) => {
            if (goal.categories) {
                cats.push(
                    ...goal.categories.filter(
                        (cat) => !cats.map((c) => c.id).includes(cat.id),
                    ),
                );
            }
        });
        cats.sort();
        setCatList(cats);
    }, [goals]);

    // base case
    if (!goals || goalsLoading) {
        return null;
    }

    // calculations
    const shownGoals = goals
        .filter((goal) => {
            let shown = true;
            if (shownCats.length > 0) {
                shown = shownCats.some((searchOpt) =>
                    searchOpt.isTag
                        ? goal.tags?.map((t) => t.id).includes(searchOpt.value)
                        : goal.categories
                              ?.map((c) => c.id)
                              .includes(searchOpt.value),
                );
            }
            if (!shown) {
                return false;
            }
            if (search && search.length > 0) {
                shown = !!(
                    goal.goal.toLowerCase().includes(search.toLowerCase()) ||
                    goal.description
                        ?.toLowerCase()
                        .includes(search.toLowerCase())
                );
            }
            return shown;
        })
        .sort((a, b) => {
            switch (sort) {
                case SortOptions.DEFAULT:
                    return 1;
                case SortOptions.NAME:
                    return a.goal.localeCompare(b.goal);
                case SortOptions.DIFFICULTY:
                    return (a.difficulty ?? 26) - (b.difficulty ?? 26);
                default:
                    return 1;
            }
        });
    if (reverse) {
        shownGoals.reverse();
    }

    return (
        <GoalManagerContext.Provider
            value={{
                slug,
                canModerate,
                selectedGoal,
                goals,
                shownGoals,
                catList,
                searchParams: { sort, search, reverse, shownCats },
                settings,
                setSelectedGoal,
                deleteGoal,
                setShownCats,
                setSort,
                setSearch,
                setReverse,
                setSettings,
                mutateGoals,
                newGoal,
                setNewGoal,
                tags,
            }}
        >
            {children}
        </GoalManagerContext.Provider>
    );
}

export function useGoalManagerContext() {
    return useContext(GoalManagerContext);
}
