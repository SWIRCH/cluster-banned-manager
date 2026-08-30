import type { FC } from "react";

export type IconProps = {
  className?: string;
  fill?: string;
  fills?: IconFillProps;
};

type IconFillProps = {
  main: string;
  second: string;
};

export type IconComponent = FC<IconProps>;
