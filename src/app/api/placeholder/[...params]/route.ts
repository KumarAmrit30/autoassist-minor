import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const resolvedParams = await params;
  const [width, height] = resolvedParams.params;

  // Create an enhanced SVG placeholder with better car illustration
  const svg = `
    <svg width="${width || 400}" height="${
    height || 300
  }" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      
      <!-- Car Body -->
      <g transform="translate(${(parseInt(width) || 400) / 2}, ${
    (parseInt(height) || 300) / 2
  })">
        <!-- Main car body -->
        <ellipse cx="0" cy="0" rx="80" ry="30" fill="url(#carGrad)" opacity="0.9"/>
        
        <!-- Car roof -->
        <ellipse cx="0" cy="-10" rx="50" ry="15" fill="url(#carGrad)" opacity="0.7"/>
        
        <!-- Windshield -->
        <ellipse cx="0" cy="-15" rx="35" ry="8" fill="#ffffff" opacity="0.6"/>
        
        <!-- Wheels -->
        <circle cx="-45" cy="25" r="12" fill="#374151"/>
        <circle cx="-45" cy="25" r="8" fill="#6b7280"/>
        <circle cx="45" cy="25" r="12" fill="#374151"/>
        <circle cx="45" cy="25" r="8" fill="#6b7280"/>
        
        <!-- Headlights -->
        <ellipse cx="-70" cy="-5" rx="8" ry="6" fill="#fbbf24" opacity="0.8"/>
        <ellipse cx="70" cy="-5" rx="8" ry="6" fill="#fbbf24" opacity="0.8"/>
        
        <!-- Grille -->
        <rect x="-20" y="-5" width="40" height="8" fill="#374151" opacity="0.6" rx="2"/>
        
        <!-- Side windows -->
        <ellipse cx="-25" cy="-12" rx="12" ry="6" fill="#94a3b8" opacity="0.5"/>
        <ellipse cx="25" cy="-12" rx="12" ry="6" fill="#94a3b8" opacity="0.5"/>
      </g>
      
      <!-- Text overlay -->
      <text x="50%" y="85%" text-anchor="middle" dominant-baseline="middle" 
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" 
            font-size="14" fill="#64748b" font-weight="500">
        Car Image Placeholder
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
