export type SelectionsMap = Record<string, Record<string, boolean>>;

const LS_KEY = "clusterSelections";

// Временное решение - только localStorage
export async function loadSelections(): Promise<SelectionsMap> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Error loading from localStorage:", e);
    return {};
  }
}

export async function saveSelections(selections: SelectionsMap): Promise<void> {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(selections));
    console.log("Selections saved to localStorage");
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
}

export async function clearSelections(): Promise<void> {
  try {
    localStorage.removeItem(LS_KEY);
    console.log("Selections cleared from localStorage");
  } catch (e) {
    console.error("Error clearing selections from localStorage:", e);
  }
}
