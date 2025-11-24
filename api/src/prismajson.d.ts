import { GeneratorSettings as GeneratorSettingsShared } from '@playbingo/shared';

export default {};

declare global {
    namespace PrismaJson {
        type GeneratorSettings = GeneratorSettingsShared;
    }
}
