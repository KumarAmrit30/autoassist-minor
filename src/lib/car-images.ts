// Car image URL generation service
// Simplified to use only placeholder images to avoid 404 errors

export function generateCarImageUrls(): string[] {
  // Always return placeholder image to avoid external URL failures
  return ["/api/placeholder/400/300"];
}

export function getCarImageWithFallback(): string {
  // Always return placeholder image
  return "/api/placeholder/400/300";
}

// Preload function - no longer needed since we only use placeholders
export function preloadCarImages() {
  // No preloading needed for placeholder images
  return;
}
