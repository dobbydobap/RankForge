import { describe, it, expect } from 'vitest';
import { ContestSegmentTree } from './segment-tree';

describe('ContestSegmentTree', () => {
  it('should initialize with correct size', () => {
    const tree = new ContestSegmentTree(120);
    expect(tree.size).toBe(121); // 0 to 120 inclusive
  });

  it('should return empty data for empty tree', () => {
    const tree = new ContestSegmentTree(60);
    const result = tree.query(0, 60);
    expect(result.totalScore).toBe(0);
    expect(result.submissionCount).toBe(0);
    expect(result.acceptedCount).toBe(0);
    expect(result.maxScoreGain).toBe(0);
  });

  it('should record and query a single score event', () => {
    const tree = new ContestSegmentTree(60);
    tree.update(10, 100, true);

    const result = tree.query(10, 10);
    expect(result.totalScore).toBe(100);
    expect(result.submissionCount).toBe(1);
    expect(result.acceptedCount).toBe(1);
  });

  it('should aggregate events across a range', () => {
    const tree = new ContestSegmentTree(120);
    tree.update(10, 100, true);
    tree.update(20, 0, false);  // wrong answer
    tree.update(30, 200, true);
    tree.update(50, 150, true);

    // Query full range
    const full = tree.query(0, 120);
    expect(full.totalScore).toBe(450);
    expect(full.submissionCount).toBe(4);
    expect(full.acceptedCount).toBe(3);

    // Query partial range
    const partial = tree.query(15, 35);
    expect(partial.totalScore).toBe(200);
    expect(partial.submissionCount).toBe(2);
    expect(partial.acceptedCount).toBe(1);
  });

  it('should track max score gain per minute', () => {
    const tree = new ContestSegmentTree(60);
    tree.update(5, 50, true);
    tree.update(5, 100, true); // same minute, accumulates
    tree.update(20, 200, true);

    // Minute 5 has total 150, minute 20 has 200
    const result = tree.query(0, 60);
    expect(result.maxScoreGain).toBe(200);
  });

  it('should handle multiple events at the same minute', () => {
    const tree = new ContestSegmentTree(60);
    tree.update(15, 100, true);
    tree.update(15, 0, false);
    tree.update(15, 50, true);

    const result = tree.query(15, 15);
    expect(result.totalScore).toBe(150);
    expect(result.submissionCount).toBe(3);
    expect(result.acceptedCount).toBe(2);
  });

  it('should return empty for out-of-range queries', () => {
    const tree = new ContestSegmentTree(60);
    tree.update(30, 100, true);

    const result = tree.query(61, 100);
    expect(result.totalScore).toBe(0);
  });

  it('should handle single-minute queries', () => {
    const tree = new ContestSegmentTree(120);
    tree.update(42, 300, true);

    expect(tree.query(42, 42).totalScore).toBe(300);
    expect(tree.query(41, 41).totalScore).toBe(0);
    expect(tree.query(43, 43).totalScore).toBe(0);
  });

  it('should handle large contest durations', () => {
    const tree = new ContestSegmentTree(300); // 5 hours
    for (let i = 0; i <= 300; i += 10) {
      tree.update(i, 50, true);
    }

    const result = tree.query(0, 300);
    expect(result.submissionCount).toBe(31); // 0, 10, 20, ..., 300
    expect(result.totalScore).toBe(31 * 50);
  });
});
