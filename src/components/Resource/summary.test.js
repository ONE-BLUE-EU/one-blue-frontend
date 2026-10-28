import { afterEach, describe, expect, it, vi } from "vitest";
import { buildConcentrationMatrix, campaignStatistics, concentrationLimitTooltip, fetchResourceRows, formatConcentration, formatTableValue, getResourceFormat, getResourceName, isSamplingCampaign, summarizeAnalyticalResults, summarizeSamples, temporalRange } from "./summary";

afterEach(() => vi.unstubAllGlobals());

describe("table value formatting", () => {
  it.each([
    ["0.00000000000000", "0"],
    ["-0.000000", "0"],
    ["1.250000000", "1.25"],
    ["41.00000000", "41"],
    [" 2.5000 ", "2.5"],
    ["0.0000012300", "0.00000123"],
    ["1.2500e-3", "0.00125"],
    ["2025-07-25", "2025-07-25"],
    ["123_ABC", "123_ABC"],
    ["1.25 ng/L", "1.25 ng/L"],
    ["9007199254740993", "9007199254740993"],
    ["Infinity", "Infinity"],
    ["", "-"],
    [null, "-"],
  ])("formats %s as %s without partially parsing text", (input, expected) => {
    expect(formatTableValue(input)).toBe(expected);
  });

  it.each(["<LOD", "<LOQ", "< LOD", "<loq"])("does not append units to %s", concentration => {
    expect(formatConcentration({ concentration, units: "ng/L" })).toBe(concentration);
  });

  it("formats numeric concentrations without losing units or zero values", () => {
    expect(formatConcentration({ concentration: "0.000000", units: "ng/L" })).toBe("0 ng/L");
    expect(formatConcentration({ concentration: "1.25000", units: "ug/L" })).toBe("1.25 ug/L");
    expect(formatConcentration({ concentration: null, units: "ng/L" })).toBe("-");
  });

  it.each([null, undefined, "", "   ", "NS", " ns ", "Concentration unavailable", "N/A", "n/a", "NA", "unknown", "-"])("shows a dash without units for unavailable concentration %s", concentration => {
    expect(formatConcentration({ concentration, units: "ng/L" })).toBe("-");
  });

  it("uses the matching row-specific threshold for LOD and LOQ tooltips", () => {
    const entry = { units: "ng/L", limit_of_detection: "0.010000", limit_of_quantification: "0.050000" };
    expect(concentrationLimitTooltip({ ...entry, concentration: "<LOD" })).toBe("Limit of detection: 0.01 ng/L");
    expect(concentrationLimitTooltip({ ...entry, concentration: " < loq " })).toBe("Limit of quantification: 0.05 ng/L");
    expect(concentrationLimitTooltip({ concentration: "<LOD", limit_of_detection: "0.000", units: "ng/L" })).toBe("Limit of detection: 0 ng/L");
  });

  it.each([undefined, null, "", "N/A", "NS"])("explicitly reports unavailable limit %s without units", limit => {
    expect(concentrationLimitTooltip({ concentration: "<LOQ", limit_of_quantification: limit, units: "ng/L" })).toBe("Limit of quantification: Unavailable");
  });

  it.each(["1.25", "0", "NS", null, "<LOD extra"])("does not add limit tooltips to %s", concentration => {
    expect(concentrationLimitTooltip({ concentration })).toBeNull();
  });
});

const sample = (overrides = {}) => ({
  sample_tag: "A",
  date_of_sampling_start: "2025-07-25 00:00:00",
  latitude: "41.394500",
  longitude: "15.727000",
  sample_matrix: "Seawater",
  ...overrides,
});

describe("resource labels", () => {
  it("only enables campaigns for the explicit theme, ignoring case", () => {
    expect(isSamplingCampaign([{ data: "Sampling Campaign" }])).toBe(true);
    expect(isSamplingCampaign([{ data: "Sampling campaign" }])).toBe(true);
    expect(isSamplingCampaign([{ data: "Chemical compounds" }])).toBe(false);
    expect(isSamplingCampaign([{ data: "Sampling campaigns" }])).toBe(false);
    expect(isSamplingCampaign(undefined)).toBe(false);
  });
  it.each([
    ["chemical_compounds_2025-12-22_uuid.csv", "Chemical compounds"],
    ["sample_2025-12-22_uuid.csv", "Samples"],
    ["analytical_results_2025-12-22_uuid.csv", "Analytical results"],
    ["analytical_methods_2025-12-22_uuid.csv", "Analytical methods"],
    ["test", "Samples"],
    ["other_data_2025-12-22_uuid.csv", "Other data"],
  ])("labels %s", (title, expected) => {
    expect(getResourceName({ data: { title } })).toBe(expected);
  });

  describe("campaign cards", () => {
    it("counts sample rows separately from merged sidebar samples and includes a date range", () => {
      const rows = [sample(), sample({ sample_tag: "B" }), sample({ date_of_sampling_start: "2025-07-26" })];
      expect(campaignStatistics("Samples", rows).map(item => item.count)).toEqual([3, 1, "2025-07-25 - 2025-07-26"]);
      expect(summarizeSamples(rows)[1].count).toBe(2);
    });

    it("counts unique chemical and method IDs, not rows", () => {
      expect(campaignStatistics("Chemical compounds", [{ susdat_id: "NS1" }, { susdat_id: "NS1" }, { susdat_id: "NS2" }])[0].count).toBe(2);
      expect(campaignStatistics("Analytical methods", [{ anal_method_serial_no: "1" }, { anal_method_serial_no: "1" }, { anal_method_serial_no: "2" }])[0].count).toBe(2);
      expect(campaignStatistics("Analytical methods", [{}])[0].count).toBeNull();
    });

    it("counts analytical rows and distinct detected compounds, including non-detections only in row totals", () => {
      const rows = [
        { sample_tag: "A", susdat_id: "NS1", detection_characterisation: "detected quantitatively" },
        { sample_tag: "A", susdat_id: "NS1", detection_characterisation: "detected qualitatively" },
        { sample_tag: "A", susdat_id: "NS2", detection_characterisation: "not detected" },
      ];
      expect(campaignStatistics("Analytical results", rows, [sample()]).map(item => item.count)).toEqual([3, 1, 1]);
      expect(campaignStatistics("Analytical results", [{ susdat_id: "NS1" }], [sample()])[2].count).toBeNull();
    });

    it("handles absent, empty, single-day and invalid dates explicitly", () => {
      expect(campaignStatistics("Samples", null)).toEqual([]);
      expect(temporalRange([])).toBe("No samples");
      expect(temporalRange([sample()])).toBe("2025-07-25");
      expect(temporalRange([sample({ date_of_sampling_start: "" })])).toBeNull();
      expect(temporalRange([sample({ date_of_sampling_start: "2025-02-30" })])).toBeNull();
    });
  });

  describe("compound/sample concentration matrix", () => {
    it("retains every detected concentration with its units and method, without counting non-detections as zero", () => {
      const matrix = buildConcentrationMatrix([
        { susdat_id: "NS1", norman_substance_name: "Caffeine", sample_tag: "B", concentration: "0", concentration_units: "ng/L", anal_method_serial_no: "1", detection_characterisation: "detected quantitatively" },
        { susdat_id: "NS1", norman_substance_name: "Caffeine", sample_tag: "B", concentration: "1.25", concentration_units: "ug/L", anal_method_serial_no: "2", detection_characterisation: "detected qualitatively" },
        { susdat_id: "NS1", sample_tag: "A", concentration: "0", detection_characterisation: "not detected" },
        { susdat_id: "NS2", sample_tag: "A", concentration: "", detection_characterisation: "detected quantitatively" },
        { susdat_id: "NS3" },
      ]);
      expect(matrix.tags).toEqual(["A", "B"]);
      expect(matrix.rows).toHaveLength(2);
      expect(matrix.rows[0].cells.get("B")).toEqual([
        { concentration: "0", units: "ng/L", method: "1", limit_of_detection: null, limit_of_quantification: null },
        { concentration: "1.25", units: "ug/L", method: "2", limit_of_detection: null, limit_of_quantification: null },
      ]);
      expect(matrix.rows[0].cells.get("A")).toEqual([]);
      expect(matrix.rows[1].cells.get("B")).toBeUndefined();
      expect(matrix.rows[1].cells.get("A")[0].concentration).toBeNull();
      expect(matrix.incomplete).toBe(1);
    });

    it("supports compound names without IDs and safe arbitrary sample tags", () => {
      const matrix = buildConcentrationMatrix([{ norman_substance_name: "Caffeine", sample_tag: "__proto__", concentration: 0, detection_characterisation: "detected" }]);
      expect(matrix.rows[0].cells.get("__proto__")[0].concentration).toBe("0");
      expect(buildConcentrationMatrix([])).toEqual({ rows: [], tags: [], incomplete: 0 });
    });

    it("retains separate CSV limits for multiple results in the same compound/sample cell", () => {
      const base = { susdat_id: "NS1", sample_tag: "A", concentration: "<LOD", detection_characterisation: "detected qualitatively", concentration_units: "ng/L" };
      const matrix = buildConcentrationMatrix([
        { ...base, limit_of_detection: "0.01", limit_of_quantification: "0.05" },
        { ...base, limit_of_detection: "0.02", limit_of_quantification: "0.1" },
      ]);
      expect(matrix.rows[0].cells.get("A").map(concentrationLimitTooltip)).toEqual([
        "Limit of detection: 0.01 ng/L",
        "Limit of detection: 0.02 ng/L",
      ]);
    });
  });

  it("uses the filename when the title does not identify a known resource", () => {
    expect(getResourceName({ data: { title: "Uploaded file", downloadURL: "https://example.test/sample_2025.csv" } })).toBe("Samples");
    expect(getResourceFormat({ data: { mediaType: "text/csv" } })).toBe("csv");
    expect(getResourceFormat({ data: { format: "CSV" } })).toBe("csv");
  });
});

describe("sample summary", () => {
  it("merges coordinates and dates regardless of tag, time, matrix or numeric formatting", () => {
    expect(summarizeSamples([
      sample(),
      sample({ sample_tag: "B", latitude: "41.3945", date_of_sampling_start: "2025-07-25 12:00:00", sample_matrix: "seawater" }),
      sample({ sample_tag: "C", date_of_sampling_start: "2025-07-26", sample_matrix: "Sediment" }),
      sample({ sample_tag: "D", latitude: "42", sample_matrix: "N/A" }),
    ]).map(statistic => statistic.count)).toEqual([2, 3, 2]);
  });

  it("does not merge missing or invalid coordinates into a fabricated station", () => {
    expect(summarizeSamples([sample({ latitude: "" })]).map(statistic => statistic.count)).toEqual([null, null, 1]);
    expect(summarizeSamples([sample({ latitude: "100" })])[0].count).toBeNull();
    expect(summarizeSamples([]).map(statistic => statistic.count)).toEqual([0, 0, 0]);
  });
});

describe("analytical summary", () => {
  const result = (overrides = {}) => ({
    sample_tag: "A", susdat_id: "NS1", detection_characterisation: "detected quantitatively", ...overrides,
  });

  it("counts detected rows, unique substances and merged analyzed samples", () => {
    const rows = [
      result(),
      result({ sample_tag: "B", detection_characterisation: "detected qualitatively" }),
      result({ sample_tag: "C", susdat_id: "NS2", detection_characterisation: "not detected" }),
    ];
    const samples = [sample(), sample({ sample_tag: "B" }), sample({ sample_tag: "C", date_of_sampling_start: "2025-07-26" })];
    expect(summarizeAnalyticalResults(rows, samples).map(statistic => statistic.count)).toEqual([2, 2, 2]);
  });

  it("reports missing matches or ambiguous sample tags as unavailable", () => {
    expect(summarizeAnalyticalResults([result()], null)[2].count).toBeNull();
    expect(summarizeAnalyticalResults([result({ sample_tag: "missing" })], [sample()])[2].count).toBeNull();
    expect(summarizeAnalyticalResults([result()], [sample(), sample({ latitude: "42" })])[2].count).toBeNull();
    expect(summarizeAnalyticalResults([result({ detection_characterisation: "" })], [sample()])[0].count).toBeNull();
  });

  it("supports substance names and sample codes when IDs and tags are absent", () => {
    expect(summarizeAnalyticalResults([
      result({ susdat_id: "", norman_substance_name: "Caffeine", sample_tag: "", sample_code: "CODE" }),
    ], [sample({ sample_tag: "", sample_code: "CODE" })]).map(statistic => statistic.count)).toEqual([1, 1, 1]);
  });

  it("reports zero analyzed samples for an empty results file even without a Samples file", () => {
    expect(summarizeAnalyticalResults([], null).map(statistic => statistic.count)).toEqual([0, 0, 0]);
  });
});

describe("complete datastore loading", () => {
  it("uses actual returned page sizes until all rows have been loaded", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 3, results: [{ id: 1 }, { id: 2 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 3, results: [{ id: 3 }] }) });
    vi.stubGlobal("fetch", fetch);
    expect(await fetchResourceRows("/api/1", "abc")).toHaveLength(3);
    expect(fetch.mock.calls[1][0]).toBe("/api/1/datastore/query/abc?limit=500&offset=2");
  });

  it.each([
    { ok: false, status: 500 },
    { ok: true, json: async () => ({ count: 2, results: [] }) },
    { ok: true, json: async () => ({ results: [] }) },
  ])("rejects unsuccessful or incomplete responses", async response => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(fetchResourceRows("/api/1", "abc")).rejects.toThrow();
  });

  it("rejects data that changes during pagination", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 2, results: [{ id: 1 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 3, results: [{ id: 2 }] }) }));
    await expect(fetchResourceRows("/api/1", "abc")).rejects.toThrow("data changed");
  });
});
