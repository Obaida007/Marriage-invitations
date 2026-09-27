import { customAlphabet } from "nanoid";

const alnum = "0123456789abcdefghijkmnopqrstuvwxyz";
export const newId = customAlphabet(alnum, 16);
/** Short, unambiguous token for personal guest links and entry passes. */
export const newGuestToken = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
export const newManageKey = customAlphabet(alnum + "ABCDEFGHJKLMNPQRSTUVWXYZ", 32);
export const randomSlugSuffix = customAlphabet("0123456789abcdefghjkmnpqrstuvwxyz", 4);
