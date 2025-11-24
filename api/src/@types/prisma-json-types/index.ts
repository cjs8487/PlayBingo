// This file must be a module, so we include an empty export.
export {};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace PrismaJson {
        type GoalTranslations = {
            [k: string]: string;
        };
    }
}