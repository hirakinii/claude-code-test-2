import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
} from '@mui/material';
import { ReactNode } from 'react';

export interface CardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ title, subtitle, actions, children, ...props }: CardProps) {
  return (
    <MuiCard {...props}>
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
        />
      )}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  );
}
