import type { ResourceBadgeToken } from '@textforge/core';
import type { ReactNode } from 'react';
import type { IconName } from './icons';
import type { BadgeTone, ResourceAttention, StatusBadge } from './models';

export interface TextForgeToolbarButtonProps {
  readonly active?: boolean;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
  readonly icon?: IconName;
  readonly kind?: 'primary' | 'secondary' | 'toggle';
  readonly label: string;
  readonly onPress?: () => void;
  readonly title?: string;
}

export interface TextForgeStatusRailProps {
  readonly badges?: ReadonlyArray<StatusBadge>;
}

export interface TextForgeCalloutProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly tone?: BadgeTone;
  readonly title?: string;
}

export interface TextForgeResourceBadgeProps {
  readonly active?: boolean;
  readonly attention?: ResourceAttention;
  readonly badge?: ResourceBadgeToken;
  readonly label?: string;
  readonly size?: 'compact' | 'regular';
}

export interface TextForgeInspectorCardProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly eyebrow?: string;
  readonly icon?: IconName;
  readonly title: string;
}

export interface TextForgeEmptyStateProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly eyebrow?: string;
  readonly icon?: IconName;
  readonly title: string;
}

export declare function TextForgeToolbarButton(props: TextForgeToolbarButtonProps): unknown;
export declare function TextForgeCallout(props: TextForgeCalloutProps): unknown;
export declare function TextForgeResourceBadge(props: TextForgeResourceBadgeProps): unknown;
export declare function TextForgeInspectorCard(props: TextForgeInspectorCardProps): unknown;
export declare function TextForgeEmptyState(props: TextForgeEmptyStateProps): unknown;
export declare function TextForgeStatusRail(props: TextForgeStatusRailProps): unknown;

