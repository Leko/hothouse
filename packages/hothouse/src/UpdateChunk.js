// @flow
import crypto from "crypto";
import type { Updates } from "@hothouse/types";

export default class UpdateChunk {
  allUpdates: { [string]: Updates };

  constructor(allUpdates: { [string]: Updates }) {
    this.allUpdates = allUpdates;
  }

  getPackagePaths(): Array<string> {
    return Object.keys(this.allUpdates);
  }

  getUpdatesBy(packagePath: string): Updates {
    if (!this.allUpdates[packagePath]) {
      throw new Error(`Cannot find path: ${packagePath}`);
    }
    return this.allUpdates[packagePath];
  }

  slugify(): string {
    const jsonStr = JSON.stringify(this.allUpdates);
    return crypto
      .createHash("md5")
      .update(jsonStr)
      .digest("hex")
      .slice(0, 10);
  }
}

export const split = (
  allUpdates: { [string]: Updates },
  perPackage: boolean
): Array<UpdateChunk> => {
  if (perPackage) {
    // $FlowFixMe(entires-returns-no-mixed)
    const allUpdateEntries: Array<Array<string, Updates>> = Object.entries(
      allUpdates
    );
    const packageNameMap = allUpdateEntries.reduce(
      (acc, [packagePath, updates]: [string, Updates]) => ({
        ...acc,
        ...updates.reduce((acc2, update) => ({ ...acc2, [update.name]: 1 }), {})
      }),
      {}
    );
    const uniquePackageNames = Object.keys(packageNameMap);
    return uniquePackageNames.map(packageName => {
      const chunk = allUpdateEntries.reduce(
        (acc, [packagePath, updates]: [string, Updates]) => ({
          ...acc,
          [packagePath]: updates.filter(update => update.name === packageName)
        }),
        {}
      );
      return new UpdateChunk(chunk);
    });
  } else {
    return [new UpdateChunk(allUpdates)];
  }
};
