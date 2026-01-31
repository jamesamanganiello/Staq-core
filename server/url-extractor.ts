import axios from 'axios';
import * as cheerio from 'cheerio';

interface ExtractedContent {
  success: boolean;
  url: string;
  domain: string;
  title?: string;
  metaDescription?: string;
  headings: string[];
  mainContent: string[];
  error?: string;
}

const BLOCKED_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^localhost$/i,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_IP_RANGES.some(pattern => pattern.test(hostname));
}

export async function extractWebsiteContent(url: string): Promise<ExtractedContent> {
  let normalizedUrl = url.trim();
  let domain: string;

  try {
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const parsedUrl = new URL(normalizedUrl);
    
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        success: false,
        url: normalizedUrl,
        domain: url,
        headings: [],
        mainContent: [],
        error: 'Invalid protocol - only HTTP/HTTPS allowed',
      };
    }

    if (isBlockedHost(parsedUrl.hostname)) {
      return {
        success: false,
        url: normalizedUrl,
        domain: parsedUrl.hostname,
        headings: [],
        mainContent: [],
        error: 'Cannot fetch internal/private URLs',
      };
    }

    domain = parsedUrl.hostname.replace('www.', '');
  } catch (e: any) {
    return {
      success: false,
      url: normalizedUrl,
      domain: url,
      headings: [],
      mainContent: [],
      error: 'Invalid URL format',
    };
  }

  try {
    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024,
    });

    const $ = cheerio.load(response.data);

    $('script, style, noscript, iframe, nav, footer, header').remove();

    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() ||
                           $('meta[property="og:description"]').attr('content')?.trim();

    const headings: string[] = [];
    $('h1, h2').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3 && text.length < 200) {
        headings.push(text);
      }
    });

    const mainContent: string[] = [];
    
    const aboutSelectors = [
      '[class*="about"]',
      '[class*="hero"]',
      '[class*="intro"]',
      '[class*="description"]',
      '[id*="about"]',
      '[id*="hero"]',
      'main p',
      'article p',
      '.content p',
      'section p',
    ];

    aboutSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 50 && text.length < 1000 && !mainContent.includes(text)) {
          mainContent.push(text);
        }
      });
    });

    if (mainContent.length < 3) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 50 && text.length < 1000 && !mainContent.includes(text)) {
          mainContent.push(text);
        }
      });
    }

    const uniqueHeadings = [...new Set(headings)].slice(0, 5);
    const uniqueContent = mainContent.slice(0, 5);

    return {
      success: true,
      url: normalizedUrl,
      domain,
      title,
      metaDescription,
      headings: uniqueHeadings,
      mainContent: uniqueContent,
    };
  } catch (error: any) {
    console.error(`Failed to fetch ${normalizedUrl}:`, error.message);
    return {
      success: false,
      url: normalizedUrl,
      domain,
      headings: [],
      mainContent: [],
      error: error.message,
    };
  }
}

export function formatExtractedContent(extracted: ExtractedContent): string {
  if (!extracted.success) {
    return `[Website fetch failed for ${extracted.domain}: ${extracted.error}]`;
  }

  const parts: string[] = [];
  parts.push(`Company website: ${extracted.domain}`);
  
  if (extracted.title) {
    parts.push(`Page title: ${extracted.title}`);
  }
  
  if (extracted.metaDescription) {
    parts.push(`Description: ${extracted.metaDescription}`);
  }
  
  if (extracted.headings.length > 0) {
    parts.push(`Key headlines: ${extracted.headings.join(' | ')}`);
  }
  
  if (extracted.mainContent.length > 0) {
    parts.push(`About the company: ${extracted.mainContent.join(' ')}`);
  }

  return parts.join('\n');
}
