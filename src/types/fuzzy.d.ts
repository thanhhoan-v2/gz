declare module 'fuzzy' {
  export interface FilterResult<T> {
    string: string;
    score: number;
    index: number;
    original: T;
  }

  export function filter<T = string>(
    pattern: string,
    arr: T[],
    opts?: {
      pre?: string;
      post?: string;
      extract?: (item: T) => string;
    }
  ): FilterResult<T>[];
}
