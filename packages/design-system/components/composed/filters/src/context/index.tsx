"use client";

import { createContext, useContext } from "react";
import { DEFAULT_I18N } from "../constants";
import type { FilterContextValue } from "../types";

const FilterContext = createContext<FilterContextValue>({
  size: "sm",
  i18n: DEFAULT_I18N,
  className: undefined,
  showAddButton: true,
  addButtonText: undefined,
  addButtonIcon: undefined,
  addButtonClassName: undefined,
  addButton: undefined,
  showSearchInput: true,
  trigger: undefined,
});

const useFilterContext = () => useContext(FilterContext);

export { FilterContext, useFilterContext };
