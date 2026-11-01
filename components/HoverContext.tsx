"use client";

import { createContext, useContext } from "react";

type Hover = { hovered: string | null; setHovered: (tag: string | null) => void };

export const HoverContext = createContext<Hover>({ hovered: null, setHovered: () => {} });

export const useHover = () => useContext(HoverContext);
