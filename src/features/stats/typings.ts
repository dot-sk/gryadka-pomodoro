import { IntervalType } from "../../entitites/countdown/constants";
import { StatEntryOwnTypes } from "./constants";

export type StatEntryType = IntervalType | StatEntryOwnTypes;

export type StatEntry = {
  start: number;
  end: number;
  time: number;
  type: StatEntryType;
};
