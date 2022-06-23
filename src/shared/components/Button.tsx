import { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  primary?: boolean;
};

export const Button = ({
  children,
  className,
  onClick,
  primary = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`rounded-full py-2 px-4 shadow-lg ${
        primary ? "bg-black text-white" : "bg-gray-300 text-white"
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
