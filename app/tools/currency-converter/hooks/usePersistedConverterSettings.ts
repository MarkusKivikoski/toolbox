import type { Dispatch, SetStateAction } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  DEFAULT_CONVERTER_SETTINGS,
  normalizeConverterSettings,
  type ConverterSettings,
} from "@/lib/currency-converter";
import { SETTINGS_STORAGE_KEY } from "../constants";
import { SUPPORTED_CURRENCY_CODES } from "../currencies.config";

type PersistedConverterSettings = {
  settings: ConverterSettings;
  setSettings: Dispatch<SetStateAction<ConverterSettings>>;
  hydrated: boolean;
};

const normalizeSettings = (stored: unknown): ConverterSettings =>
  normalizeConverterSettings(stored, SUPPORTED_CURRENCY_CODES);

/** Converter settings persisted in `localStorage` via the shared storage-backed hook. */
export function usePersistedConverterSettings(): PersistedConverterSettings {
  const {
    value: settings,
    setValue: setSettings,
    hydrated,
  } = useLocalStorageState({
    storageKey: SETTINGS_STORAGE_KEY,
    defaultValue: DEFAULT_CONVERTER_SETTINGS,
    normalize: normalizeSettings,
  });
  return { settings, setSettings, hydrated };
}
