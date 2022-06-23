// a component that renders navbar with two buttons: timer and stats

const NavBarButton = ({
  onClick,
  title,
  isActive,
  className,
  children,
}: {
  onClick?: () => void;
  title?: string;
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <button
      className={`${className} ${
        isActive ? "bg-white shadow-sm" : "bg-transparent"
      } rounded-md py-1 px-2 text-black capitalize`}
      onClick={onClick}
    >
      {children || title}
    </button>
  );
};

export const NavBar = ({
  onClick,
  activeTab,
  tabs,
  className,
}: {
  onClick?: (tab: string) => void;
  activeTab: string;
  tabs: string[];
  className?: string;
}) => {
  return (
    <div
      className={`grid grid-cols-3 bg-gray-200 gap-x-2 px-1 py-1 rounded-lg ${className}`}
    >
      {tabs.map((tab) => {
        return (
          <NavBarButton
            key={tab}
            title={tab}
            isActive={tab === activeTab}
            onClick={() => onClick && onClick(tab)}
          />
        );
      })}
    </div>
  );
};
