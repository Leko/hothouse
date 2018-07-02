/* eslint-env jest */
// @flow
import assert from "assert";
import UpdateChunk, { split } from "../src/UpdateChunk";

test("split returns single chunk when perPackage=false", () => {
  const allUpdates = {
    "/some/package/a": [
      {
        name: "pkg-a",
        current: "1.2.3",
        currentRange: "^1.2.3",
        latest: "4.5.6",
        dev: true
      }
    ]
  };
  const expected = [new UpdateChunk(allUpdates)];
  assert.deepStrictEqual(split(allUpdates, false), expected);
});
test("split can split per packages package when perPackage=true", () => {
  const allUpdates = {
    "/some/package/a": [
      {
        name: "pkg-a",
        current: "1.2.3",
        currentRange: "^1.2.3",
        latest: "4.5.6",
        dev: true
      },
      {
        name: "pkg-b",
        current: "3.4.5",
        currentRange: "^3.4.5",
        latest: "6.7.8",
        dev: true
      }
    ]
  };
  const expected = [
    new UpdateChunk({
      "/some/package/a": [
        {
          name: "pkg-a",
          current: "1.2.3",
          currentRange: "^1.2.3",
          latest: "4.5.6",
          dev: true
        }
      ]
    }),
    new UpdateChunk({
      "/some/package/a": [
        {
          name: "pkg-b",
          current: "3.4.5",
          currentRange: "^3.4.5",
          latest: "6.7.8",
          dev: true
        }
      ]
    })
  ];
  assert.deepStrictEqual(split(allUpdates, true), expected);
});
test("split can split per packages between each multiple package when perPackage=true", () => {
  const allUpdates = {
    "/some/package/a": [
      {
        name: "pkg-a",
        current: "1.2.3",
        currentRange: "^1.2.3",
        latest: "4.5.6",
        dev: true
      },
      {
        name: "pkg-b",
        current: "3.4.5",
        currentRange: "^3.4.5",
        latest: "6.7.8",
        dev: true
      }
    ],
    "/some/package/b": [
      {
        name: "pkg-b",
        current: "1.2.3",
        currentRange: "^1.2.3",
        latest: "6.7.8",
        dev: true
      },
      {
        name: "pkg-c",
        current: "5.6.7",
        currentRange: "^5.6.7",
        latest: "7.8.9",
        dev: true
      }
    ]
  };
  const expected = [
    new UpdateChunk({
      "/some/package/a": [
        {
          name: "pkg-a",
          current: "1.2.3",
          currentRange: "^1.2.3",
          latest: "4.5.6",
          dev: true
        }
      ],
      "/some/package/b": []
    }),
    new UpdateChunk({
      "/some/package/a": [
        {
          name: "pkg-b",
          current: "3.4.5",
          currentRange: "^3.4.5",
          latest: "6.7.8",
          dev: true
        }
      ],
      "/some/package/b": [
        {
          name: "pkg-b",
          current: "1.2.3",
          currentRange: "^1.2.3",
          latest: "6.7.8",
          dev: true
        }
      ]
    }),
    new UpdateChunk({
      "/some/package/a": [],
      "/some/package/b": [
        {
          name: "pkg-c",
          current: "5.6.7",
          currentRange: "^5.6.7",
          latest: "7.8.9",
          dev: true
        }
      ]
    })
  ];
  assert.deepStrictEqual(split(allUpdates, true), expected);
});
