import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const resolvedParams = await params;
  const [width, height] = resolvedParams.params;
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" 
            font-size="16" fill="#ffffff" font-weight="500">
        Car Image ${width}x${height}
      </text>
      <!-- Car Icon -->
      <g transform="translate(${(parseInt(width) || 400) / 2 - 15}, ${(parseInt(height) || 300) / 2 + 15})">
        <path d="M3 12h18l-2 5H5l-2-5z" fill="#ffffff" opacity="0.8"/>
        <circle cx="7" cy="19" r="2" fill="#ffffff" opacity="0.8"/>
        <circle cx="17" cy="19" r="2" fill="#ffffff" opacity="0.8"/>
        <path d="m5 17 2-8h10l2 8" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.8"/>
      </g>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
