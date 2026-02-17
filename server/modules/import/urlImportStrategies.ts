export type UrlImportMode = "auto" | "single" | "portfolio";

export type UrlImportReasonCode =
  | "invalid_url"
  | "fetch_failed"
  | "no_listings_found"
  | "parse_failed";

export type ListingDraft = {
  sourceUrl: string;
  title?: string;
  address?: string;
  description?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  images: string[];
};

export type UrlImportProgressUpdate = {
  stage: string;
  progress: number;
  counts?: Record<string, number>;
};

export type UrlImportPipelineOptions = {
  maxCandidatePages?: number;
  onProgress?: (update: UrlImportProgressUpdate) => Promise<void> | void;
};

export type UrlImportPipelineResult =
  | {
      ok: true;
      listings: ListingDraft[];
      triedStrategies: string[];
      debug?: {
        httpStatus?: number;
        contentType?: string;
        htmlHead?: string;
        finalUrl?: string;
      };
    }
  | {
      ok: false;
      reasonCode: UrlImportReasonCode;
      triedStrategies: string[];
      debug?: {
        httpStatus?: number;
        contentType?: string;
        htmlHead?: string;
        finalUrl?: string;
      };
    };

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function runUrlImportPipeline(
  url: string,
  _mode: UrlImportMode,
  options: UrlImportPipelineOptions = {}
): Promise<UrlImportPipelineResult> {
  const onProgress = options.onProgress;
  const triedStrategies: string[] = ["single_page_scrape"];

  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, reasonCode: "invalid_url", triedStrategies };
  }

  await onProgress?.({ stage: "fetching", progress: 20, counts: { discovered: 1, fetched: 0, parsed: 0 } });

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return { ok: false, reasonCode: "fetch_failed", triedStrategies };
  }

  const debug = {
    httpStatus: response.status,
    contentType: response.headers.get("content-type") || undefined,
    finalUrl: response.url || url,
    htmlHead: "",
  };

  if (!response.ok) {
    return { ok: false, reasonCode: "fetch_failed", triedStrategies, debug };
  }

  const html = await response.text();
  debug.htmlHead = html.slice(0, 500);

  await onProgress?.({ stage: "parsing", progress: 55, counts: { discovered: 1, fetched: 1, parsed: 0 } });

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : undefined;
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const description = descMatch ? cleanText(descMatch[1]) : undefined;

  const listing: ListingDraft = {
    sourceUrl: debug.finalUrl || url,
    title: title || "Imported listing",
    address: debug.finalUrl || url,
    description,
    images: [],
  };

  await onProgress?.({ stage: "parsing", progress: 70, counts: { discovered: 1, fetched: 1, parsed: 1 } });

  if (!listing.title && !listing.description) {
    return { ok: false, reasonCode: "no_listings_found", triedStrategies, debug };
  }

  return {
    ok: true,
    listings: [listing],
    triedStrategies,
    debug,
  };
}
