import { FC, ReactNode, useCallback, useState } from "react";

type ToggleVisibilityProps = {
  title: string;
  appear?: boolean;
  children?: ReactNode;
};
export const ToggleVisibility: FC<ToggleVisibilityProps> = ({
  title,
  children,
  appear = true,
}) => {
  const [show, setShow] = useState(appear);
  const toggle = useCallback(() => setShow((show) => !show), []);

  return (
    <div>
      <div className="flex justify-between items-center" onClick={toggle}>
        <div className="text-gray-600">{title}</div>
        <div
          className={`transform transition-transform ease-out origin-center ${
            show ? "" : "-rotate-45"
          }`}
        >
          &times;
        </div>
      </div>
      {show ? (
        <div className="px-3 py-3 bg-gray-100 rounded-xl">{children}</div>
      ) : null}
    </div>
  );
};
