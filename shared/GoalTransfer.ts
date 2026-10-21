const excludedGoalFields = [
    'id',
    'gameId',
    'game',
    'createdAt',
    'updatedAt',
    'oldCategories',
    'goalImageId',
    'secondaryGoalImageId',
    'goalImageTagId',
] as const;

export type ExcludedGoalField = (typeof excludedGoalFields)[number];

const goalFieldDenylist = new Set<string>(excludedGoalFields);

type RelationNames<T> = T extends readonly unknown[] ? string[] : T;

type GoalTransferData<T> = {
    [K in keyof T as K extends ExcludedGoalField ? never : K]: K extends
        | 'categories'
        | 'tags'
        ? RelationNames<T[K]>
        : T[K];
};

export function goalTransferData<T extends object>(
    goal: T,
): GoalTransferData<T> {
    return Object.fromEntries(
        Object.entries(goal)
            .filter(
                ([key, value]) => !goalFieldDenylist.has(key) && value != null,
            )
            .map(([key, value]) => [
                key,
                (key === 'categories' || key === 'tags') && Array.isArray(value)
                    ? value.map((entry: string | { name: string }) =>
                          typeof entry === 'string' ? entry : entry.name,
                      )
                    : value,
            ]),
    ) as GoalTransferData<T>;
}
