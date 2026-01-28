// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require("@testing-library/jest-dom");

HTMLCanvasElement.prototype.getContext = () => {
  return null;
};

HTMLCanvasElement.prototype.toDataURL = () => {
  return "data:image/png;base64,mock";
};

document.fonts = { ready: Promise.resolve() };

// Mock window.electronStore for tests
global.window.electronStore = {
  get: jest.fn(() => Promise.resolve(undefined)),
  set: jest.fn(() => Promise.resolve()),
};
