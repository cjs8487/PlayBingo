import { makeGeneratorSchema } from './GeneratorSettings';
import { GoalCategory } from '@playbingo/types';

/**
 * Generates the default GeneratorSettings by parsing an empty object through the schema
 * This ensures defaults are always in sync with the schema definition
 */
export const getDefaultGeneratorSettings = (categories: GoalCategory[] = []) => {
    const { schema } = makeGeneratorSchema(categories);
    return schema.parse({});
};

/**
 * Gets the default GeneratorSettings as a JSON string for database defaults
 */
export const getDefaultGeneratorSettingsJson = (categories: GoalCategory[] = []): string => {
    return JSON.stringify(getDefaultGeneratorSettings(categories));
};

/**
 * Gets the default GeneratorSettings for use when no categories are available
 * This is useful for database defaults since categories aren't known at schema level
 */
export const getBaseDefaultGeneratorSettings = () => {
    return getDefaultGeneratorSettings([]);
};
