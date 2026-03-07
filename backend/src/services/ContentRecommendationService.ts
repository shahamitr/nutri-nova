import axios from 'axios';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  url: string;
}

interface SearchOptions {
  query: string;
  maxResults?: number;
  category?: 'exercise' | 'recipe' | 'wellness';
}

interface HealthProfile {
  activity_level?: string;
  joint_pain?: boolean;
  back_pain?: boolean;
  neck_pain?: boolean;
  diet_preference?: string;
  allergies?: string;
  age?: number;
  health_goals?: string;
}

export class ContentRecommendationService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private cache: Map<string, { data: YouTubeVideo[]; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 hour in milliseconds

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key not configured. Content recommendations will not work.');
    }
  }

  /**
   * Get personalized exercise videos based on user's health profile
   */
  async getExerciseVideos(profile: HealthProfile, maxResults: number = 12): Promise<YouTubeVideo[]> {
    const query = this.buildExerciseQuery(profile);
    const cacheKey = `exercise_${query}_${maxResults}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const videos = await this.searchYouTube({
      query,
      maxResults,
      category: 'exercise',
    });

    // Cache results
    this.saveToCache(cacheKey, videos);

    return videos;
  }

  /**
   * Get recipe videos based on user's dietary preferences
   */
  async getRecipeVideos(profile: HealthProfile, mealType?: string, maxResults: number = 12): Promise<YouTubeVideo[]> {
    const query = this.buildRecipeQuery(profile, mealType);
    const cacheKey = `recipe_${query}_${maxResults}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const videos = await this.searchYouTube({
      query,
      maxResults,
ess: 'health wellness tips lifestyle',
    };

    const query = queries[topic] || queries.wellness;
    const cacheKey = `wellness_${topic}_${maxResults}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const videos = await this.searchYouTube({
      query,
      maxResults,
      category: 'wellness',
    });

    // Cache results
    this.saveToCache(cacheKey, videos);

    return videos;
  }

  /**
   * Search YouTube with given options
   */
  private async searchYouTube(options: SearchOptions): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    try {
      // Search for videos
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: options.query,
          type: 'video',
          maxResults: options.maxResults || 12,
          videoDuration: 'medium', // 4-20 minutes
          videoDefinition: 'high',
          relevanceLanguage: 'en',
          safeSearch: 'strict',
          key: this.apiKey,
        },
      });

      const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

      // Get video details (duration, views)
      const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds,
          key: this.apiKey,
        },
      });

      // Combine search results with details
      const videos: YouTubeVideo[] = searchResponse.data.items.map((item: any, index: number) => {
        const details = detailsResponse.data.items[index];

        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: details ? this.formatDuration(details.contentDetails.duration) : undefined,
          viewCount: details ? this.formatViewCount(details.statistics.viewCount) : undefined,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        };
      });

      return videos;
    } catch (error: any) {
      console.error('YouTube API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch YouTube videos');
    }
  }

  /**
   * Build exercise search query based on user profile
   */
  private buildExerciseQuery(profile: HealthProfile): string {
    const parts: string[] = ['workout', 'exercise'];

    // Activity level
    if (profile.activity_level === 'SEDENTARY') {
      parts.push('beginner', 'easy');
    } else if (profile.activity_level === 'LIGHT') {
      parts.push('beginner', 'moderate');
    } else if (profile.activity_level === 'MODERATE') {
      parts.push('intermediate');
    } else if (profile.activity_level === 'ACTIVE') {
      parts.push('advanced');
    }

    // Pain considerations
    if (profile.joint_pain) {
      parts.push('low impact', 'joint friendly');
    }
    if (profile.back_pain) {
      parts.push('back safe', 'no back strain');
    }
    if (profile.neck_pain) {
      parts.push('neck safe');
    }

    // Age considerations
    if (profile.age && profile.age > 50) {
      parts.push('senior friendly');
    }

    // Health goals
    if (profile.health_goals) {
      if (profile.health_goals.toLowerCase().includes('weight loss')) {
        parts.push('fat burning', 'cardio');
      }
      if (profile.health_goals.toLowerCase().includes('strength')) {
        parts.push('strength training');
      }
      if (profile.health_goals.toLowerCase().includes('flexibility')) {
        parts.push('stretching', 'yoga');
      }
    }

    // Default to home workout
    parts.push('home workout', 'no equipment');

    return parts.slice(0, 6).join(' '); // Limit to 6 terms for better results
  }

  /**
   * Build recipe search query based on user profile
   */
  private buildRecipeQuery(profile: HealthProfile, mealType?: string): string {
    const parts: string[] = ['healthy', 'recipe'];

    // Meal type
    if (mealType) {
      parts.push(mealType);
    }

    // Diet preference
    if (profile.diet_preference === 'VEGETARIAN') {
      parts.push('vegetarian');
    } else if (profile.diet_preference === 'EGGETARIAN') {
      parts.push('vegetarian', 'egg');
    } else if (profile.diet_preference === 'NON_VEGETARIAN') {
      parts.push('protein');
    }

    // Allergies
    if (profile.allergies && !profile.allergies.toLowerCase().includes('none')) {
      const allergyFree = profile.allergies.split(',')[0].trim();
      parts.push(`${allergyFree} free`);
    }

    // Health goals
    if (profile.health_goals) {
      if (profile.health_goals.toLowerCase().includes('weight loss')) {
        parts.push('low calorie', 'weight loss');
      }
      if (profile.health_goals.toLowerCase().includes('muscle')) {
        parts.push('high protein');
      }
      if (profile.health_goals.toLowerCase().includes('energy')) {
        parts.push('energy boosting');
      }
    }

    parts.push('easy', 'quick');

    return parts.slice(0, 6).join(' ');
  }

  /**
   * Format ISO 8601 duration to readable format
   */
  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    const parts: string[] = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds && !hours) parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  /**
   * Format view count to readable format
   */
  private formatViewCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): YouTubeVideo[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  /**
   * Save to cache
   */
  private saveToCache(key: string, data: YouTubeVideo[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries (keep last 100)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
