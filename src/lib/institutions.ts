import { COLLEGES } from "@/lib/types";

interface CollegeEntry {
  "College Name": string;
}

interface UniversityEntry {
  "University Name": string;
}

let cachedInstitutions: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function cleanInstitutionName(name: string) {
  return collapseWhitespace(
    name
      .replace(/\s*\(Id:\s*[CU]-\d+\)\s*/gi, " ")
      .replace(/[–—]/g, "-")
  );
}

export function normalizeInstitutionKey(name: string) {
  return cleanInstitutionName(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bthe\b/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortInstitutions(values: string[]) {
  return values.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

async function loadJson<T>(path: string): Promise<T[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function loadInstitutionNames(): Promise<string[]> {
  if (cachedInstitutions) return cachedInstitutions;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const [collegeRows, universityRows] = await Promise.all([
        loadJson<CollegeEntry>("data/indian_colleges.json"),
        loadJson<UniversityEntry>("data/indian_universities.json"),
      ]);

      const institutionMap = new Map<string, string>();

      const addInstitution = (rawName: string) => {
        const cleaned = cleanInstitutionName(rawName);
        const key = normalizeInstitutionKey(cleaned);
        if (!cleaned || !key) return;

        const existing = institutionMap.get(key);
        if (!existing || cleaned.length < existing.length) {
          institutionMap.set(key, cleaned);
        }
      };

      for (const college of collegeRows) {
        addInstitution(college["College Name"]);
      }

      for (const university of universityRows) {
        addInstitution(university["University Name"]);
      }

      for (const college of COLLEGES) {
        addInstitution(college);
      }

      cachedInstitutions = sortInstitutions([...institutionMap.values()]);
      return cachedInstitutions;
    } catch {
      const fallback = new Map<string, string>();

      for (const college of COLLEGES) {
        const cleaned = cleanInstitutionName(college);
        const key = normalizeInstitutionKey(cleaned);
        if (cleaned && key && !fallback.has(key)) {
          fallback.set(key, cleaned);
        }
      }

      cachedInstitutions = sortInstitutions([...fallback.values()]);
      return cachedInstitutions;
    }
  })();

  return loadingPromise;
}

export async function searchInstitutionNames(query: string, limit = 40): Promise<string[]> {
  const normalizedQuery = normalizeInstitutionKey(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const institutions = await loadInstitutionNames();
  const queryWords = normalizedQuery.split(" ").filter(Boolean);

  return institutions
    .map((name) => {
      const key = normalizeInstitutionKey(name);
      const startsWith = key.startsWith(normalizedQuery);
      const allWordsMatch = queryWords.every((word) => key.includes(word));
      return { name, key, startsWith, allWordsMatch };
    })
    .filter((entry) => entry.allWordsMatch)
    .sort((a, b) => {
      if (a.startsWith !== b.startsWith) {
        return a.startsWith ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    })
    .slice(0, limit)
    .map((entry) => entry.name);
}

export function dedupeInstitutionNames(names: string[]) {
  const deduped = new Map<string, string>();

  for (const name of names) {
    const cleaned = cleanInstitutionName(name);
    const key = normalizeInstitutionKey(cleaned);
    if (!cleaned || !key || deduped.has(key)) continue;
    deduped.set(key, cleaned);
  }

  return sortInstitutions([...deduped.values()]);
}
