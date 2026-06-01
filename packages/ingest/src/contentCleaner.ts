import * as cheerio from "cheerio";

/**
 * Extract readable prose from a Paul Graham essay page. PG essays render their
 * body inside <td> cells, so we collect substantial cells and drop nav/ads.
 * Migrated from the original be/ ingestion script.
 */
export function cleanHtmlContent(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, noscript").remove();
  $("map, area, img[usemap], .nav-sidebar").remove();
  $('script[src*="turbifycdn"], script[src*="store.turbify"]').remove();

  const textChunks = $("td")
    .map((_i, elem) => {
      const text = $(elem).text().trim();
      return text.length > 100 &&
        !text.includes("JavaScript must be enabled") &&
        !text.includes("Translation") &&
        !text.includes("Japanese") &&
        !text.includes("Spanish") &&
        !text.includes("Romanian") &&
        !text.includes("Chinese") &&
        !text.includes("Arabic") &&
        !text.includes("Thanks to") &&
        !/^\s*\d+\s*$/.test(text)
        ? text
        : null;
    })
    .get()
    .filter((text): text is string => text !== null);

  if (textChunks.length > 0) {
    return cleanText(textChunks.join("\n\n"));
  }

  const bodyText = $("body").text();
  return bodyText ? cleanText(bodyText) : "";
}

/** Normalize whitespace and strip common boilerplate/noise. */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .replace(/JavaScript must be enabled.*?to use this site\./gi, "")
    .replace(/Want to start a startup.*?Y Combinator\./gi, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "")
    .replace(/\b\d{1,2}:\d{2}\s*(AM|PM)?\b/gi, "")
    .replace(/Page \d+/gi, "")
    .replace(/[.,!?;:]{2,}/g, ". ")
    .trim()
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/\s+/g, " ");
}
