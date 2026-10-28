const resourceNames = {
  sample: "Samples",
  samples: "Samples",
  test: "Samples",
  analytical_results: "Analytical results",
  analytical_methods: "Analytical methods",
  chemical_compounds: "Chemical compounds",
};

export const campaignResourceNames = ["Samples", "Chemical compounds", "Analytical methods", "Analytical results"];

export function isSamplingCampaign(themes) {
  return Array.isArray(themes) && themes.some(theme =>
    String(typeof theme === "string" ? theme : theme?.data || "").trim().toLowerCase() === "sampling campaign"
  );
}

export function getResourceName(resource) {
  const data = resource.data || {};
  const filename = (data.downloadURL || data.accessURL || "").split("/").pop()?.split("?")[0];
  const title = data.title || filename || "Data";
  for (const [prefix, label] of Object.entries(resourceNames)) {
    const matches = value => value && new RegExp(`^${prefix}(?:[_. -]|$)`, "i").test(value);
    if (matches(title) || matches(filename)) return label;
  }
  const name = title.replace(/\.[^.]+$/, "").replace(/_\d{4}-\d{2}-\d{2}.*$/, "").replace(/_/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getResourceFormat(resource) {
  const data = resource.data || {};
  return (data.format || data.mediaType?.split("/")[1] || "data").toLowerCase();
}

export function formatTableValue(input) {
  if (input === null || input === undefined || input === "") return "-";
  const text = String(input);
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim())) return text;
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number))) return text;
  return String(number);
}

export function formatConcentration(entry) {
  if (/^(?:|ns|concentration unavailable|n\/a|na|null|unknown|-)$/i.test(String(entry.concentration ?? "").trim())) return "-";
  const concentration = formatTableValue(entry.concentration);
  const limit = /^<\s*(?:LOD|LOQ)\s*$/i.test(concentration.trim());
  return `${concentration}${entry.units && !limit ? ` ${entry.units}` : ""}`;
}

export function concentrationLimitTooltip(entry) {
  const marker = String(entry.concentration ?? "").trim().match(/^<\s*(LOD|LOQ)$/i);
  if (!marker) return null;
  const detection = marker[1].toUpperCase() === "LOD";
  const limit = formatConcentration({
    concentration: detection ? entry.limit_of_detection : entry.limit_of_quantification,
    units: entry.units,
  });
  return `Limit of ${detection ? "detection" : "quantification"}: ${limit === "-" ? "Unavailable" : limit}`;
}

export async function fetchResourceRows(apiURL, id, signal) {
  const rows = [];
  let total;
  do {
    const response = await fetch(`${apiURL}/datastore/query/${encodeURIComponent(id)}?limit=500&offset=${rows.length}`, { signal });
    if (!response.ok) throw new Error(`Data request failed (${response.status}).`);
    const page = await response.json();
    const count = Number(page.count);
    if (!Array.isArray(page.results) || !Number.isInteger(count) || count < 0) {
      throw new Error("The datastore returned an invalid response.");
    }
    if (total !== undefined && total !== count) throw new Error("The data changed while loading. Please retry.");
    total = count;
    if (!page.results.length && rows.length < total) throw new Error("The datastore returned incomplete data.");
    rows.push(...page.results);
  } while (rows.length < total);
  return rows;
}

function value(input) {
  const text = String(input ?? "").trim();
  return /^(?:|n\/a|na|null|unknown)$/i.test(text) ? null : text;
}

function stationKey(row) {
  const latitude = value(row.latitude);
  const longitude = value(row.longitude);
  if (latitude === null || longitude === null) return null;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return JSON.stringify([lat, lon]);
}

function sampleKey(row) {
  const station = stationKey(row);
  const date = value(row.date_of_sampling_start)?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return station && date ? JSON.stringify([date, station]) : null;
}

function uniqueCount(rows, key) {
  const keys = rows.map(key);
  return keys.some(item => item === null) ? null : new Set(keys).size;
}

function compoundKey(row) {
  return value(row.susdat_id) || value(row.norman_substance_name)?.toLowerCase() || null;
}

function isDetected(row) {
  return /^detected(?:\s|$)/i.test(value(row.detection_characterisation) || "");
}

export function countCompounds(rows) {
  return uniqueCount(rows, compoundKey);
}

export function temporalRange(rows) {
  if (!rows.length) return "No samples";
  const dates = rows.map(row => value(row.date_of_sampling_start)?.match(/^\d{4}-\d{2}-\d{2}/)?.[0]);
  if (dates.some(date => !date || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) return null;
  dates.sort();
  return dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} to ${dates[dates.length - 1]}`;
}

export function campaignStatistics(name, rows, samples) {
  if (!rows) return [];
  switch (name) {
    case "Samples":
      return [
        { label: "Total records", count: rows.length },
        { label: "Stations", count: uniqueCount(rows, stationKey) },
        { label: "Temporal range", count: temporalRange(rows) },
      ];
    case "Chemical compounds":
      return [{ label: "Unique compounds", count: countCompounds(rows) }];
    case "Analytical methods":
      return [{ label: "Analytical methods", count: uniqueCount(rows, row => value(row.anal_method_serial_no)) }];
    case "Analytical results":
      return [
        { label: "Total records", count: rows.length },
        { label: "Samples analyzed", count: summarizeAnalyticalResults(rows, samples)[2].count },
        { label: "Detected compounds", count: rows.some(row => value(row.detection_characterisation) === null) ? null : countCompounds(rows.filter(isDetected)) },
      ];
    default:
      return [];
  }
}

export function buildConcentrationMatrix(rows) {
  const compounds = new Map();
  const tags = new Set();
  let incomplete = 0;
  for (const row of rows) {
    const id = compoundKey(row);
    const tag = value(row.sample_tag);
    if (!id || !tag) {
      incomplete++;
      continue;
    }
    tags.add(tag);
    if (!compounds.has(id)) compounds.set(id, {
      key: id,
      compound: value(row.norman_substance_name) || id,
      identifier: value(row.susdat_id),
      cells: new Map(),
    });
    const compound = compounds.get(id);
    if (!compound.cells.has(tag)) compound.cells.set(tag, []);
    if (isDetected(row)) compound.cells.get(tag).push({
      concentration: value(row.concentration),
      units: value(row.concentration_units),
      method: value(row.anal_method_serial_no),
      limit_of_detection: value(row.limit_of_detection),
      limit_of_quantification: value(row.limit_of_quantification),
    });
  }
  return { rows: [...compounds.values()], tags: [...tags].sort(), incomplete };
}

export function summarizeSamples(rows) {
  return [
    { label: "Sampling stations", count: uniqueCount(rows, stationKey) },
    { label: "Total samples", count: uniqueCount(rows, sampleKey) },
    { label: "Matrices covered", count: new Set(rows.map(row => value(row.sample_matrix)?.toLowerCase()).filter(Boolean)).size },
  ];
}

export function summarizeAnalyticalResults(rows, samples) {
  const sampleMap = new Map();
  for (const sample of samples || []) {
    for (const field of ["sample_tag", "sample_code"]) {
      const id = value(sample[field]);
      if (!id) continue;
      const key = sampleKey(sample);
      if (sampleMap.has(id) && sampleMap.get(id) !== key) sampleMap.set(id, null);
      else if (!sampleMap.has(id)) sampleMap.set(id, key);
    }
  }
  const detections = rows.every(row => value(row.detection_characterisation) !== null)
    ? rows.filter(row => /^detected(?:\s|$)/i.test(value(row.detection_characterisation))).length
    : null;
  return [
    { label: "Detections", count: detections },
    { label: "Unique substances", count: uniqueCount(rows, row => value(row.susdat_id) || value(row.norman_substance_name)?.toLowerCase() || null) },
    { label: "Samples analyzed", count: rows.length === 0 ? 0 : samples ? uniqueCount(rows, row => sampleMap.get(value(row.sample_tag) || value(row.sample_code)) ?? null) : null },
  ];
}
