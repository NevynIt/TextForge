import type {
  CommandContext,
  CommandContribution,
  CommandDispatcher,
  CommandHandler,
  CommandManifest,
  ContributionManifest,
  ResolvedCommand,
} from './types';

export declare function createCommand(
  id: string,
  label: string,
  overrides?: Partial<CommandContribution>,
): CommandContribution;
export declare function createCommandManifest(
  packageId: string,
  commands?: ReadonlyArray<CommandContribution>,
): CommandManifest;
export declare function createCommandContext(overrides?: CommandContext): CommandContext;
export declare function matchesCommandContext(command: CommandContribution, context?: CommandContext): boolean;
export declare function resolveCommandState(
  command: CommandContribution,
  context?: CommandContext,
): ResolvedCommand;
export declare function createCommandRegistry(
  initialManifests?: ReadonlyArray<CommandManifest | Pick<ContributionManifest, 'packageId' | 'commands'> | { readonly id: string; readonly commands?: ReadonlyArray<CommandContribution> }>,
): CommandRegistry;
export declare function createCommandDispatcher(options?: {
  readonly registry?: CommandRegistry;
  readonly getContext?: () => CommandContext;
  readonly handlers?: Readonly<Record<string, CommandHandler>>;
}): CommandDispatcher;
