import React from "react";

import { VerticalNavigation } from "./libs/VerticalNavigation";

export const VerticalNavigationTemplate: React.FC = ({ children }: any) => {
  return (
    <div className="flex mx-auto" style={{ minHeight: "100vh" }}>
      <div className="fixed left-20 top-0 h-full z-10">
        <VerticalNavigation />
      </div>
      <div
        className="flex-1 flex ml-80   justify-around pl-2  w-full"
        style={{
          paddingLeft: "var(--nav-width, 200px)", // Use padding instead of margin
        }}
      >
        <div className="w-full ml-32 px-4">
          {" "}
          {/* Added padding for better spacing */}
          {children}
        </div>
      </div>
    </div>
  );
};
