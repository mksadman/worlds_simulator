import type { StaticImageData } from "next/image";
import AL from "./images/70px-Anyone's_Legend_darkmode.png";
import BLG from "./images/100px-Bilibili_Gaming_2021_allmode.png";
import CFO from "./images/53px-CTBC_Flying_Oyster_2022_allmode.png";
import DK from "./images/100px-Dplus_darkmode.png";
import G2 from "./images/44px-G2_Esports_2019_darkmode.png";
import GEN from "./images/58px-Gen.G_Esports_2026_allmode.png";
import HLE from "./images/100px-Hanwha_Life_Esports_darkmode.png";
import IG from "./images/50px-Invictus_Gaming_darkmode.png";
import KC from "./images/53px-Karmine_Corp_allmode.png";
import LOS from "./images/66px-LOS_allmode.png";
import LYON from "./images/43px-LYON_2025_allmode.png";
import MKOI from "./images/31px-Movistar_KOI_2025_allmode.png";
import T1 from "./images/100px-T1_2019_allmode.png";
import TES from "./images/36px-Top_Esports_allmode.png";
import TL from "./images/44px-Team_Liquid_2024_darkmode.png";
import TSW from "./images/95px-Secret_Whales_darkmode.png";

// Several logos are white "darkmode" versions, so they are always shown on a dark plate.
export const LOGOS: Record<string, StaticImageData> = {
  HLE,
  GEN,
  BLG,
  G2,
  T1,
  LYON,
  AL,
  DK,
  KC,
  TSW,
  TL,
  TES,
  IG,
  MKOI,
  CFO,
  LØS: LOS,
};
