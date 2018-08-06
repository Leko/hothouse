/* eslint-env jest */
// @flow
import assert from "assert";
import BlackList from "../src/BlackList";

test("BlackList#match can use exact string", () => {
  const list = new BlackList(["react-native", "react-native-svg"]);
  assert(list.match("react-native"));
  assert(list.match("react-native-svg"));
  assert(!list.match("react"));
});
test("BlackList#match can use pattern string", () => {
  const list = new BlackList(["react-native*"]);
  assert(list.match("react-native"));
  assert(list.match("react-native-svg"));
  assert(!list.match("react"));
});
