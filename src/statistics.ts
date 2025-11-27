/**
 * statistics.ts
 *
 * Usage statistics and analytics for Listen
 * Tracks transcription usage, time saved, and performance
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface TranscriptionStat {
  timestamp: number;
  duration: number;  // Recording duration in ms
  wordCount: number;
  charactersCount: number;
  modelUsed: string;
  processingTime: number;  // Transcription processing time in ms
  language: string;
}

export interface DailyStats {
  date: string;  // YYYY-MM-DD
  transcriptions: number;
  totalWords: number;
  totalCharacters: number;
  totalRecordingTime: number;
  totalProcessingTime: number;
  modelsUsed: { [model: string]: number };
}

export class StatisticsManager {
  private stats: TranscriptionStat[] = [];
  private statsPath: string;
  private maxStats = 1000;  // Keep last 1000 transcriptions

  constructor() {
    this.statsPath = path.join(
      app.getPath('userData'),
      'statistics.json'
    );
    this.loadStats();
  }

  private loadStats() {
    try {
      if (fs.existsSync(this.statsPath)) {
        const data = fs.readFileSync(this.statsPath, 'utf-8');
        this.stats = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      this.stats = [];
    }
  }

  private saveStats() {
    try {
      const dir = path.dirname(this.statsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Keep only last maxStats entries
      if (this.stats.length > this.maxStats) {
        this.stats = this.stats.slice(-this.maxStats);
      }

      fs.writeFileSync(
        this.statsPath,
        JSON.stringify(this.stats, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save statistics:', error);
    }
  }

  record(stat: TranscriptionStat) {
    this.stats.push(stat);
    this.saveStats();
  }

  // Get statistics for a date range
  getStats(startDate?: Date, endDate?: Date): TranscriptionStat[] {
    if (!startDate && !endDate) {
      return this.stats;
    }

    const start = startDate ? startDate.getTime() : 0;
    const end = endDate ? endDate.getTime() : Date.now();

    return this.stats.filter(s => s.timestamp >= start && s.timestamp <= end);
  }

  // Get daily aggregated statistics
  getDailyStats(days: number = 30): DailyStats[] {
    const dailyMap = new Map<string, DailyStats>();
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    // Filter recent stats
    const recentStats = this.stats.filter(s => s.timestamp >= cutoff);

    // Aggregate by day
    for (const stat of recentStats) {
      const date = new Date(stat.timestamp);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          transcriptions: 0,
          totalWords: 0,
          totalCharacters: 0,
          totalRecordingTime: 0,
          totalProcessingTime: 0,
          modelsUsed: {}
        });
      }

      const daily = dailyMap.get(dateKey)!;
      daily.transcriptions++;
      daily.totalWords += stat.wordCount;
      daily.totalCharacters += stat.charactersCount;
      daily.totalRecordingTime += stat.duration;
      daily.totalProcessingTime += stat.processingTime;
      daily.modelsUsed[stat.modelUsed] = (daily.modelsUsed[stat.modelUsed] || 0) + 1;
    }

    return Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  // Calculate total statistics
  getTotalStats() {
    const total = {
      transcriptions: this.stats.length,
      totalWords: 0,
      totalCharacters: 0,
      totalRecordingTime: 0,  // in ms
      totalProcessingTime: 0,  // in ms
      averageWordsPerTranscription: 0,
      averageProcessingTime: 0,
      timeSaved: 0,  // Estimated time saved vs typing
      modelsUsed: {} as { [model: string]: number },
      languagesUsed: {} as { [lang: string]: number }
    };

    for (const stat of this.stats) {
      total.totalWords += stat.wordCount;
      total.totalCharacters += stat.charactersCount;
      total.totalRecordingTime += stat.duration;
      total.totalProcessingTime += stat.processingTime;
      total.modelsUsed[stat.modelUsed] = (total.modelsUsed[stat.modelUsed] || 0) + 1;
      total.languagesUsed[stat.language] = (total.languagesUsed[stat.language] || 0) + 1;
    }

    if (this.stats.length > 0) {
      total.averageWordsPerTranscription = total.totalWords / this.stats.length;
      total.averageProcessingTime = total.totalProcessingTime / this.stats.length;

      // Estimate time saved: average typing speed is 40 words/minute
      const typingTimeMs = (total.totalWords / 40) * 60 * 1000;
      total.timeSaved = typingTimeMs - total.totalRecordingTime;
    }

    return total;
  }

  // Get model performance comparison
  getModelPerformance() {
    const modelStats = new Map<string, {
      count: number;
      avgProcessingTime: number;
      avgWordCount: number;
      totalProcessingTime: number;
    }>();

    for (const stat of this.stats) {
      if (!modelStats.has(stat.modelUsed)) {
        modelStats.set(stat.modelUsed, {
          count: 0,
          avgProcessingTime: 0,
          avgWordCount: 0,
          totalProcessingTime: 0
        });
      }

      const ms = modelStats.get(stat.modelUsed)!;
      ms.count++;
      ms.totalProcessingTime += stat.processingTime;
      ms.avgWordCount = ((ms.avgWordCount * (ms.count - 1)) + stat.wordCount) / ms.count;
    }

    // Calculate averages
    for (const [model, stats] of modelStats) {
      stats.avgProcessingTime = stats.totalProcessingTime / stats.count;
    }

    return Array.from(modelStats.entries()).map(([model, stats]) => ({
      model,
      ...stats
    }));
  }

  // Export statistics to JSON
  exportToJSON(): string {
    return JSON.stringify({
      totalStats: this.getTotalStats(),
      dailyStats: this.getDailyStats(90),
      modelPerformance: this.getModelPerformance(),
      rawData: this.stats
    }, null, 2);
  }

  // Clear all statistics
  clear() {
    this.stats = [];
    this.saveStats();
  }
}
