"use client";
import { Spin } from "./spin";

const Loader = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Spin text="Loading..." />
    </div>
  );
};

export default Loader;
