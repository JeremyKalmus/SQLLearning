/**
 * Parse praise text into an array of items
 * Handles numbered lists, bullet points, and newline-separated text
 */
export const parsePraise = (text) => {
  if (Array.isArray(text)) return text;
  if (!text) return [];
  
  // Split by numbered patterns (1. 2. 3. etc.) or bullet points (-)
  const numberedMatch = text.match(/\d+\.\s+[^\d]+/g);
  if (numberedMatch) {
    return numberedMatch.map(item => item.replace(/^\d+\.\s+/, '').trim());
  }
  
  // Split by bullet points
  const bulletMatch = text.match(/[-•]\s+[^-•]+/g);
  if (bulletMatch) {
    return bulletMatch.map(item => item.replace(/^[-•]\s+/, '').trim());
  }
  
  // Split by newlines if present
  if (text.includes('\n')) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+\.\s+/, '').replace(/^[-•]\s+/, '').trim());
  }
  
  // If no clear structure, return as single item
  return [text];
};

