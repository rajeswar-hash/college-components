import { supabase } from "@/integrations/supabase/client";
import { COLLEGES } from "@/lib/types";

interface CollegeEntry {
  "College Name": string;
}

interface UniversityEntry {
  "University Name": string;
}

interface ApprovedCollegeRequestEntry {
  college_name: string;
  city: string;
  state: string;
}

let cachedInstitutions: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;
let baseInstitutionsPromise: Promise<string[]> | null = null;

const INSTITUTION_ALIASES: Record<string, string> = {
  "goa college of engineering gec": "Govt. of Goa College of Engineering, Goa, Farmagudi, Ponda",
  "goa college of engineering": "Govt. of Goa College of Engineering, Goa, Farmagudi, Ponda",
  "govt of goa college of engineering goa farmagudi ponda": "Govt. of Goa College of Engineering, Goa, Farmagudi, Ponda",
  "don bosco college of engineering fatorda": "Don Bosco College of Engineering, Fatorda, Margao",
  "don bosco college of engineering fatora margao": "Don Bosco College of Engineering, Fatorda, Margao",
  "don bosco college of engineering fatorda margao": "Don Bosco College of Engineering, Fatorda, Margao",
};

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

export function canonicalInstitutionName(name: string) {
  const cleaned = cleanInstitutionName(name);
  const normalized = cleaned
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return INSTITUTION_ALIASES[normalized] ?? cleaned;
}

export function normalizeInstitutionKey(name: string) {
  return canonicalInstitutionName(name)
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

async function loadBaseInstitutions(): Promise<string[]> {
  if (baseInstitutionsPromise) return baseInstitutionsPromise;

  baseInstitutionsPromise = (async () => {
    try {
      const [collegeRows, universityRows] = await Promise.all([
        loadJson<CollegeEntry>("data/indian_colleges.json"),
        loadJson<UniversityEntry>("data/indian_universities.json"),
      ]);

      const institutionMap = new Map<string, string>();

      const addInstitution = (rawName: string) => {
        const cleaned = canonicalInstitutionName(rawName);
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

      return sortInstitutions([...institutionMap.values()]);
    } catch {
      const fallback = new Map<string, string>();

      for (const college of COLLEGES) {
        const cleaned = canonicalInstitutionName(college);
        const key = normalizeInstitutionKey(cleaned);
        if (cleaned && key && !fallback.has(key)) {
          fallback.set(key, cleaned);
        }
      }

      return sortInstitutions([...fallback.values()]);
    }
  })();

  return baseInstitutionsPromise;
}

export async function loadInstitutionNames(): Promise<string[]> {
  if (cachedInstitutions) return cachedInstitutions;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const baseInstitutions = await loadBaseInstitutions();
    const institutionMap = new Map<string, string>();

    const addInstitution = (rawName: string) => {
      const cleaned = canonicalInstitutionName(rawName);
      const key = normalizeInstitutionKey(cleaned);
      if (!cleaned || !key) return;

      const existing = institutionMap.get(key);
      if (!existing || cleaned.length < existing.length) {
        institutionMap.set(key, cleaned);
      }
    };

    for (const college of baseInstitutions) {
      addInstitution(college);
    }

    const { data: approvedRequests, error } = await supabase.rpc("get_approved_college_requests");

    if (!error) {
      for (const request of (approvedRequests as ApprovedCollegeRequestEntry[] | null) || []) {
        const withLocation = [request.college_name, request.city, request.state].filter(Boolean).join(", ");
        addInstitution(withLocation || request.college_name);
      }
    }

    cachedInstitutions = sortInstitutions([...institutionMap.values()]);
    return cachedInstitutions;
  })();

  return loadingPromise;
}

export function invalidateInstitutionNamesCache() {
  cachedInstitutions = null;
  loadingPromise = null;
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
    const cleaned = canonicalInstitutionName(name);
    const key = normalizeInstitutionKey(cleaned);
    if (!cleaned || !key || deduped.has(key)) continue;
    deduped.set(key, cleaned);
  }

  return sortInstitutions([...deduped.values()]);
}
