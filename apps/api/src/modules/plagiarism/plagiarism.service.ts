import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Basic token-based plagiarism detection.
 *
 * Approach: Tokenize source code (strip whitespace, comments, variable names),
 * then compute n-gram similarity between pairs of accepted submissions.
 */

@Injectable()
export class PlagiarismService {
  constructor(private prisma: PrismaService) {}

  async checkContest(contestId: string, problemId?: string) {
    const where: any = {
      contestId,
      verdict: 'ACCEPTED',
    };
    if (problemId) where.problemId = problemId;

    const submissions = await this.prisma.submission.findMany({
      where,
      include: {
        user: { select: { username: true } },
        problem: { select: { title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by problem, then compare within each group
    const byProblem = new Map<string, typeof submissions>();
    for (const sub of submissions) {
      // Only take first AC per user per problem
      const key = sub.problemId;
      if (!byProblem.has(key)) byProblem.set(key, []);
      const list = byProblem.get(key)!;
      if (!list.some((s) => s.userId === sub.userId)) {
        list.push(sub);
      }
    }

    const suspiciousPairs: {
      submissionA: string;
      submissionB: string;
      userA: string;
      userB: string;
      problemTitle: string;
      similarity: number;
    }[] = [];

    for (const [, subs] of byProblem) {
      for (let i = 0; i < subs.length; i++) {
        for (let j = i + 1; j < subs.length; j++) {
          const sim = this.calculateSimilarity(
            subs[i].sourceCode,
            subs[j].sourceCode,
            subs[i].language,
          );
          if (sim >= 0.8) {
            suspiciousPairs.push({
              submissionA: subs[i].id,
              submissionB: subs[j].id,
              userA: subs[i].user.username,
              userB: subs[j].user.username,
              problemTitle: subs[i].problem.title,
              similarity: Math.round(sim * 100),
            });
          }
        }
      }
    }

    suspiciousPairs.sort((a, b) => b.similarity - a.similarity);

    return {
      contestId,
      totalChecked: submissions.length,
      suspiciousPairs,
    };
  }

  private calculateSimilarity(codeA: string, codeB: string, language: string): number {
    const tokensA = this.tokenize(codeA, language);
    const tokensB = this.tokenize(codeB, language);

    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    // N-gram similarity (trigrams)
    const n = 3;
    const ngramsA = this.getNgrams(tokensA, n);
    const ngramsB = this.getNgrams(tokensB, n);

    const setA = new Set(ngramsA);
    const setB = new Set(ngramsB);

    let intersection = 0;
    for (const gram of setA) {
      if (setB.has(gram)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union; // Jaccard similarity
  }

  private tokenize(code: string, language: string): string[] {
    // Strip comments
    let cleaned = code;
    if (['CPP', 'JAVA', 'JAVASCRIPT', 'GO'].includes(language)) {
      cleaned = cleaned.replace(/\/\/.*$/gm, ''); // single-line
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line
    }
    if (language === 'PYTHON') {
      cleaned = cleaned.replace(/#.*$/gm, '');
    }

    // Strip string literals
    cleaned = cleaned.replace(/"[^"]*"/g, 'STR');
    cleaned = cleaned.replace(/'[^']*'/g, 'STR');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Tokenize: split on non-alphanumeric (keep operators as tokens)
    const tokens = cleaned
      .split(/([{}()\[\];,+\-*/%=<>!&|^~?.:]|\s+)/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Normalize variable names to VAR (very basic — just lowercase single words)
    // This is intentionally simple for a portfolio project
    return tokens.map((t) => {
      if (/^[a-z_][a-z0-9_]*$/i.test(t) && !this.isKeyword(t, language)) {
        return 'VAR';
      }
      return t;
    });
  }

  private getNgrams(tokens: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join('|'));
    }
    return ngrams;
  }

  private isKeyword(token: string, language: string): boolean {
    const keywords: Record<string, Set<string>> = {
      CPP: new Set(['int', 'long', 'double', 'float', 'char', 'bool', 'void', 'string',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
        'class', 'struct', 'public', 'private', 'include', 'using', 'namespace', 'std',
        'vector', 'map', 'set', 'pair', 'sort', 'cin', 'cout', 'endl', 'true', 'false',
        'const', 'auto', 'sizeof', 'new', 'delete', 'nullptr', 'template', 'typename']),
      PYTHON: new Set(['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return',
        'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'pass', 'break',
        'continue', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'lambda',
        'print', 'range', 'len', 'int', 'str', 'list', 'dict', 'set', 'input', 'map']),
      JAVA: new Set(['int', 'long', 'double', 'float', 'char', 'boolean', 'void', 'String',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
        'class', 'public', 'private', 'static', 'final', 'new', 'import', 'package',
        'try', 'catch', 'throw', 'throws', 'true', 'false', 'null', 'this', 'super']),
      JAVASCRIPT: new Set(['var', 'let', 'const', 'function', 'if', 'else', 'for', 'while',
        'return', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined',
        'import', 'export', 'from', 'require', 'module', 'console', 'log']),
      GO: new Set(['func', 'var', 'const', 'type', 'struct', 'interface', 'if', 'else',
        'for', 'range', 'return', 'package', 'import', 'fmt', 'main', 'int', 'string',
        'bool', 'true', 'false', 'nil', 'make', 'append', 'len', 'cap']),
    };
    return keywords[language]?.has(token) ?? false;
  }
}
